/**
 * SessionLibrary — the catalog-and-navigation layer over persisted transcripts.
 */
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { basename, join } from "node:path";
import { TranscriptStore, fsBackend } from "../conductor/index.js";
import type { BranchNode, PriorTurn, SavedSession } from "./contract.js";

const SESSION_FILE_EXT = ".ndjson";
const PREVIEW_LIMIT = 72;

export interface SessionLibraryOptions {
  readonly sessionsDir: string;
}

export class SessionLibrary {
  readonly #dir: string;
  readonly #backend: ReturnType<typeof fsBackend>;

  constructor(options: SessionLibraryOptions) {
    this.#dir = options.sessionsDir;
    this.#backend = fsBackend(options.sessionsDir);
  }

  get directory(): string {
    return this.#dir;
  }

  async list(options: { readonly deep?: boolean } = {}): Promise<SavedSession[]> {
    const ids = await this.#sessionIds();
    const rows = await Promise.all(
      ids.map((id) => (options.deep ? this.#deepRow(id) : this.#shallowRow(id))),
    );
    return rows.sort(byMostRecent);
  }

  async open(id: string): Promise<TranscriptStore | null> {
    return TranscriptStore.open(id, { backend: this.#backend });
  }

  async rename(fromId: string, toId: string): Promise<string> {
    const fromPath = this.pathOf(fromId);
    const toPath = this.pathOf(toId);
    if (await this.#missing(fromPath)) {
      throw new Error(`SessionLibrary.rename: no session "${fromId}"`);
    }
    if (!(await this.#missing(toPath))) {
      throw new Error(`SessionLibrary.rename: session "${toId}" already exists`);
    }
    await mkdir(this.#dir, { recursive: true });
    await rename(fromPath, toPath);
    return toPath;
  }

  async remove(id: string): Promise<boolean> {
    const path = this.pathOf(id);
    if (await this.#missing(path)) return false;
    await rm(path, { force: true });
    return true;
  }

  pathOf(id: string): string {
    return join(this.#dir, `${id}${SESSION_FILE_EXT}`);
  }

  tree(store: TranscriptStore): BranchNode[] {
    const nodes = [...store.state().nodes.values()];
    const currentLeaf = store.head.leaf;
    const childrenOf = new Map<string | null, typeof nodes>();
    for (const node of nodes) {
      const bucket = childrenOf.get(node.parent) ?? [];
      bucket.push(node);
      childrenOf.set(node.parent, bucket);
    }
    const hasChildren = new Set<string>();
    for (const node of nodes) {
      if (node.parent !== null) hasChildren.add(node.parent);
    }
    const out: BranchNode[] = [];
    const walk = (entry: (typeof nodes)[number], depth: number): void => {
      out.push({
        id: entry.id,
        parent: entry.parent,
        label: labelFor(entry, depth),
        depth,
        isLeaf: !hasChildren.has(entry.id),
        isCurrent: entry.id === currentLeaf,
      });
      for (const child of childrenOf.get(entry.id) ?? []) {
        walk(child, depth + 1);
      }
    };
    for (const root of childrenOf.get(null) ?? []) {
      walk(root, 0);
    }
    return out;
  }

  priorTurns(store: TranscriptStore): PriorTurn[] {
    const out: PriorTurn[] = [];
    for (const entry of store.pathTo()) {
      if (entry.role !== "user") continue;
      const text = messageText(entry.content).trim();
      if (text.length === 0) continue;
      out.push({ entryId: entry.id, text, preview: previewOf(text) });
    }
    return out;
  }

  async #sessionIds(): Promise<string[]> {
    let names: string[];
    try {
      names = await readdir(this.#dir);
    } catch {
      return [];
    }
    return names
      .filter((name) => name.endsWith(SESSION_FILE_EXT))
      .map((name) => basename(name, SESSION_FILE_EXT));
  }

  async #shallowRow(id: string): Promise<SavedSession> {
    const path = this.pathOf(id);
    const meta = await this.#fileMeta(path);
    return { id, path, ...meta };
  }

  async #deepRow(id: string): Promise<SavedSession> {
    const path = this.pathOf(id);
    const meta = await this.#fileMeta(path);
    const store = await this.open(id);
    if (store === null) return { id, path, ...meta };
    const branch = store.pathTo();
    const conversational = branch.filter(isConversational);
    const opener = conversational.find((entry) => entry.role === "user");
    const preview = opener ? previewOf(messageText(opener.content)) : undefined;
    return {
      id,
      path,
      ...meta,
      messageCount: conversational.length,
      ...(preview ? { preview, name: preview } : {}),
    };
  }

  async #fileMeta(path: string): Promise<{ size?: number; lastModified?: number }> {
    try {
      const info = await stat(path);
      return { size: info.size, lastModified: info.mtimeMs };
    } catch {
      return {};
    }
  }

  async #missing(path: string): Promise<boolean> {
    try {
      await readFile(path);
      return false;
    } catch {
      return true;
    }
  }
}

function isConversational(entry: { role: string }): boolean {
  return entry.role === "user" || entry.role === "assistant" || entry.role === "tool";
}

function byMostRecent(a: SavedSession, b: SavedSession): number {
  const delta = (b.lastModified ?? 0) - (a.lastModified ?? 0);
  return delta !== 0 ? delta : a.id.localeCompare(b.id);
}

function labelFor(
  entry: { id: string; role: string; content: unknown },
  depth: number,
): string {
  const indent = "  ".repeat(depth);
  switch (entry.role) {
    case "user":
      return `${indent}user: ${previewOf(messageText(entry.content))}`;
    case "assistant":
      return `${indent}assistant`;
    case "tool":
      return `${indent}tool: ${toolNameOf(entry.content)}`;
    case "condense":
      return `${indent}condense`;
    case "system":
      return `${indent}system`;
    default:
      return `${indent}note`;
  }
}

function toolNameOf(message: { toolName?: unknown }): string {
  const candidate = message.toolName;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : "tool";
}

function messageText(message: unknown): string {
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content) {
    if (
      block &&
      typeof block === "object" &&
      (block as { type?: unknown }).type === "text"
    ) {
      const text = (block as { text?: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }
  return parts.join("");
}

function previewOf(text: string, limit: number = PREVIEW_LIMIT): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  return `${flat.slice(0, Math.max(0, limit - 1))}\u2026`;
}