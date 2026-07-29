import { ulid } from "ulid";
import type { AgentMessage } from "indusagi/agent";
import type { Usage } from "indusagi/ai";
import { TRANSCRIPT_SCHEMA } from "../contract.js";
import type { SessionHead, TranscriptEntry, TranscriptRole } from "../contract.js";
import { encodeEntry, encodeHead, parseSessionText, roleForMessage } from "./serialize.js";

export interface TranscriptBackend {
  locate(sessionId: string): string;
  read(sessionId: string): Promise<string | null>;
  append(sessionId: string, line: string): Promise<void>;
  rewrite(sessionId: string, text: string): Promise<void>;
}

export interface TranscriptState {
  readonly nodes: ReadonlyMap<string, TranscriptEntry>;
  readonly head: SessionHead;
}

export interface TranscriptClock {
  readonly id: () => string;
  readonly now: () => string;
}

export interface TranscriptStoreOptions {
  readonly backend?: TranscriptBackend;
  readonly clock?: TranscriptClock;
}

export function memoryBackend(): TranscriptBackend {
  const files = new Map<string, string[]>();
  return {
    locate: (sessionId) => `mem:${sessionId}`,
    read: async (sessionId) => {
      const lines = files.get(sessionId);
      return lines ? lines.join("\n") : null;
    },
    append: async (sessionId, line) => {
      const lines = files.get(sessionId) ?? [];
      lines.push(line);
      files.set(sessionId, lines);
    },
    rewrite: async (sessionId, text) => {
      files.set(sessionId, text.length === 0 ? [] : text.split("\n"));
    },
  };
}

export function fsBackend(dir: string): TranscriptBackend {
  const fileOf = async (sessionId: string) => {
    const path = await import("node:path");
    return path.join(dir, `${sessionId}.ndjson`);
  };
  return {
    locate: (sessionId) => `${dir}/${sessionId}.ndjson`,
    read: async (sessionId) => {
      const fs = await import("node:fs/promises");
      try { return await fs.readFile(await fileOf(sessionId), "utf8"); } catch { return null; }
    },
    append: async (sessionId, line) => {
      const fs = await import("node:fs/promises");
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(await fileOf(sessionId), `${line}\n`, "utf8");
    },
    rewrite: async (sessionId, text) => {
      const fs = await import("node:fs/promises");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(await fileOf(sessionId), text.length === 0 ? "" : `${text}\n`, "utf8");
    },
  };
}

export function replay(sessionId: string, entries: readonly TranscriptEntry[], leaf: string | null): TranscriptState {
  const nodes = new Map<string, TranscriptEntry>();
  for (const entry of entries) nodes.set(entry.id, entry);
  return { nodes, head: { sessionId, leaf } };
}

function deepestLeaf(entries: readonly TranscriptEntry[]): string | null {
  if (entries.length === 0) return null;
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const depthOf = (id: string) => {
    let depth = 0;
    let cursor: string | null = id;
    const seen = new Set<string>();
    while (cursor !== null && !seen.has(cursor)) {
      seen.add(cursor);
      const node = byId.get(cursor);
      if (!node) break;
      depth++;
      cursor = node.parent;
    }
    return depth;
  };
  let best = entries[0];
  let bestDepth = depthOf(best.id);
  for (const entry of entries) {
    const depth = depthOf(entry.id);
    if (depth > bestDepth || (depth === bestDepth && entry.id > best.id)) {
      best = entry;
      bestDepth = depth;
    }
  }
  return best.id;
}

const liveClock: TranscriptClock = { id: () => ulid(), now: () => new Date().toISOString() };

export class TranscriptStore {
  #state: TranscriptState;
  readonly #backend: TranscriptBackend;
  readonly #clock: TranscriptClock;

  constructor(sessionId: string, options: TranscriptStoreOptions = {}) {
    this.#backend = options.backend ?? memoryBackend();
    this.#clock = options.clock ?? liveClock;
    this.#state = replay(sessionId, [], null);
  }

  get sessionId(): string { return this.#state.head.sessionId; }
  get head(): SessionHead { return this.#state.head; }
  get usage(): Usage | undefined { return this.#state.head.usage; }
  get size(): number { return this.#state.nodes.size; }
  locate(sessionId = this.sessionId): string { return this.#backend.locate(sessionId); }
  get(id: string): TranscriptEntry | undefined { return this.#state.nodes.get(id); }

  async append(content: AgentMessage, role?: TranscriptRole, meta?: Readonly<Record<string, unknown>>): Promise<TranscriptEntry> {
    const entry: TranscriptEntry = {
      id: this.#clock.id(),
      parent: this.#state.head.leaf,
      role: role ?? roleForMessage(content),
      content,
      createdAt: this.#clock.now(),
      ...(meta !== undefined ? { meta } : {}),
    };
    await this.#backend.append(this.sessionId, encodeEntry(entry));
    this.#commit(entry);
    return entry;
  }

  async persistUsage(usage: Usage): Promise<void> {
    this.#state = { nodes: this.#state.nodes, head: { ...this.#state.head, usage } };
    await this.#flush();
  }

  async branchAt(id: string): Promise<void> {
    if (!this.#state.nodes.has(id)) throw new Error(`TranscriptStore.branchAt: unknown node "${id}"`);
    this.#state = { nodes: this.#state.nodes, head: { sessionId: this.sessionId, leaf: id } };
    await this.#flush();
  }

  async reset(): Promise<void> {
    this.#state = { nodes: this.#state.nodes, head: { sessionId: this.sessionId, leaf: null } };
    await this.#flush();
  }

  startNewSession(sessionId: string): void { this.#state = replay(sessionId, [], null); }

  pathTo(from?: string): TranscriptEntry[] {
    const chain: TranscriptEntry[] = [];
    let cursor = from ?? this.#state.head.leaf;
    const seen = new Set<string>();
    while (cursor !== null) {
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const node = this.#state.nodes.get(cursor);
      if (!node) break;
      chain.push(node);
      cursor = node.parent;
    }
    return chain.reverse();
  }

  messages(from?: string): AgentMessage[] { return this.pathTo(from).map((entry) => entry.content); }

  async load(sessionId = this.sessionId): Promise<boolean> {
    const text = await this.#backend.read(sessionId);
    if (text === null) return false;
    const parsed = parseSessionText(sessionId, text);
    const leaf = parsed.head?.leaf ?? deepestLeaf(parsed.entries);
    const base = replay(sessionId, parsed.entries, leaf);
    this.#state = parsed.head?.usage === undefined ? base : { nodes: base.nodes, head: { ...base.head, usage: parsed.head.usage } };
    return true;
  }

  static async open(sessionId: string, options: TranscriptStoreOptions = {}): Promise<TranscriptStore | null> {
    const store = new TranscriptStore(sessionId, options);
    return await store.load(sessionId) ? store : null;
  }

  state(): TranscriptState { return this.#state; }

  #commit(entry: TranscriptEntry): void {
    const nodes = new Map(this.#state.nodes);
    nodes.set(entry.id, entry);
    this.#state = { nodes, head: { sessionId: this.sessionId, leaf: entry.id } };
  }

  async #flush(): Promise<void> {
    const lines = [encodeHead(this.#state.head), ...[...this.#state.nodes.values()].map(encodeEntry)];
    await this.#backend.rewrite(this.sessionId, lines.join("\n"));
  }
}

export { TRANSCRIPT_SCHEMA };
