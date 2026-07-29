import { buildSessionContext, convertToLlm, loadEntriesFromFile, parseSessionEntries } from "indusagi/agent";
import type { AgentMessage } from "indusagi/agent";
import type { Message } from "indusagi/ai";
import { TRANSCRIPT_SCHEMA } from "../contract.js";
import type { SessionHead, TranscriptEntry, TranscriptRole } from "../contract.js";

export interface ParsedSessionFile {
  readonly head: SessionHead | null;
  readonly entries: TranscriptEntry[];
}

export function roleForMessage(message: AgentMessage): TranscriptRole {
  switch (message.role) {
    case "user": return "user";
    case "assistant": return "assistant";
    case "toolResult": return "tool";
    case "compactionSummary":
    case "branchSummary": return "condense";
    default: return "note";
  }
}

export function encodeEntry(entry: TranscriptEntry): string {
  return JSON.stringify({
    schema: TRANSCRIPT_SCHEMA,
    kind: "entry",
    id: entry.id,
    prev: entry.parent,
    role: entry.role,
    message: entry.content,
    at: entry.createdAt,
    ...(entry.meta !== undefined ? { meta: entry.meta } : {}),
  });
}

export function encodeHead(head: SessionHead): string {
  return JSON.stringify({
    schema: TRANSCRIPT_SCHEMA,
    kind: "head",
    sessionId: head.sessionId,
    leaf: head.leaf,
    ...(head.usage !== undefined ? { usage: head.usage } : {}),
  });
}

function isFileLine(value: unknown): value is any {
  return typeof value === "object" && value !== null && (value as any).schema === TRANSCRIPT_SCHEMA
    && ((value as any).kind === "head" || (value as any).kind === "entry");
}

export function parseSessionText(sessionId: string, text: string): ParsedSessionFile {
  const entries: TranscriptEntry[] = [];
  let leaf: string | null | undefined;
  let usage: SessionHead["usage"];
  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(trimmed); } catch { continue; }
    if (!isFileLine(parsed)) continue;
    if (parsed.kind === "head") {
      leaf = parsed.leaf;
      usage = parsed.usage;
    } else {
      entries.push({
        id: parsed.id,
        parent: parsed.prev,
        role: parsed.role,
        content: parsed.message,
        createdAt: parsed.at,
        ...(parsed.meta !== undefined ? { meta: parsed.meta } : {}),
      });
    }
  }
  return {
    head: leaf === undefined ? null : { sessionId, leaf, ...(usage !== undefined ? { usage } : {}) },
    entries,
  };
}

export function branchToMessages(branch: readonly TranscriptEntry[]): AgentMessage[] {
  return branch.map((entry) => entry.content);
}

export function branchToLlmMessages(branch: readonly TranscriptEntry[]): Message[] {
  return convertToLlm(branchToMessages(branch)) as Message[];
}

function legacyEntriesToTranscript(entries: any[]): TranscriptEntry[] {
  const messages = buildSessionContext(entries).messages as AgentMessage[];
  let parent: string | null = null;
  return messages.map((content, index) => {
    const id = `legacy_${index.toString(36)}`;
    const entry: TranscriptEntry = {
      id,
      parent,
      role: roleForMessage(content),
      content,
      createdAt: new Date(0).toISOString(),
    };
    parent = id;
    return entry;
  });
}

export function importLegacyFile(filePath: string): TranscriptEntry[] {
  return legacyEntriesToTranscript(loadEntriesFromFile(filePath) as any[]);
}

export function importLegacyText(text: string): TranscriptEntry[] {
  return legacyEntriesToTranscript(parseSessionEntries(text) as any[]);
}

export function resolveLegacyMessages(filePath: string): AgentMessage[] {
  return buildSessionContext(loadEntriesFromFile(filePath) as any[]).messages as AgentMessage[];
}
