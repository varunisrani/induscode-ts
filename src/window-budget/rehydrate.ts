/**
 * Window-budget / rehydrate — re-attach recently-read files after a condense.
 */
import type { AgentMessage } from "./contract.js";
import { estimateMessageTokens } from "./budget/estimate.js";

/** Prefix marking a synthetic message that restores a file body post-compaction. */
export const RESTORED_FILE_PREFIX = "[Restored file after compaction]";

const DEFAULT_MAX_FILES = 5;
const DEFAULT_TOKEN_BUDGET = 8e3;
const DEFAULT_READ_TOOL_NAME = "read";

function isRecord4(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function resultBodyText(message: AgentMessage): string {
  if (!isRecord4(message)) return "";
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content) {
    if (
      isRecord4(block) &&
      block.type === "text" &&
      typeof block.text === "string"
    ) {
      parts.push(block.text);
    }
  }
  return parts.join("\n");
}

function collectVisibleReadPaths(kept: AgentMessage[], readToolName: string): Set<string> {
  const paths = new Set<string>();
  for (const message of kept) {
    if (!isRecord4(message) || message.role !== "assistant") continue;
    const content = Array.isArray(message.content) ? message.content : [];
    for (const block of content) {
      if (!isRecord4(block) || block.type !== "toolCall") continue;
      if (block.name !== readToolName) continue;
      const args = isRecord4(block.arguments) ? block.arguments : undefined;
      const path = args && typeof args.path === "string" ? args.path : "";
      if (path.length > 0) paths.add(path);
    }
  }
  return paths;
}

interface DroppedRead {
  order: number;
  path: string;
  body: string;
}

function collectDroppedReads(
  dropped: AgentMessage[],
  readToolName: string,
): DroppedRead[] {
  const calls = new Map<string, { path: string; order: number }>();
  for (let i = 0; i < dropped.length; i++) {
    const message = dropped[i];
    if (!isRecord4(message) || message.role !== "assistant") continue;
    const content = Array.isArray(message.content) ? message.content : [];
    for (const block of content) {
      if (!isRecord4(block) || block.type !== "toolCall") continue;
      if (block.name !== readToolName) continue;
      const id = typeof block.id === "string" ? block.id : "";
      const args = isRecord4(block.arguments) ? block.arguments : undefined;
      const path = args && typeof args.path === "string" ? args.path : "";
      if (id.length > 0 && path.length > 0) calls.set(id, { path, order: i });
    }
  }
  if (calls.size === 0) return [];
  const byPath = new Map<string, DroppedRead>();
  for (let i = 0; i < dropped.length; i++) {
    const message = dropped[i];
    if (!isRecord4(message) || message.role !== "toolResult") continue;
    if ((message as { isError?: unknown }).isError === true) continue;
    const id = typeof (message as { toolCallId?: unknown }).toolCallId === "string"
      ? (message as { toolCallId: string }).toolCallId
      : "";
    const call = calls.get(id);
    if (call === undefined) continue;
    const body = resultBodyText(message as AgentMessage);
    if (body.length === 0) continue;
    byPath.set(call.path, { order: i, path: call.path, body });
  }
  return [...byPath.values()];
}

/**
 * Build the synthetic user messages that re-attach the most-recently-read files
 * dropped by a condense.
 */
export function rehydrateRecentReads(
  dropped: AgentMessage[],
  kept: AgentMessage[],
  opts: {
    maxFiles?: number;
    tokenBudget?: number;
    readToolName?: string;
  } = {},
): AgentMessage[] {
  const maxFiles = Math.max(0, opts.maxFiles ?? DEFAULT_MAX_FILES);
  const tokenBudget = Math.max(0, opts.tokenBudget ?? DEFAULT_TOKEN_BUDGET);
  const readToolName = opts.readToolName ?? DEFAULT_READ_TOOL_NAME;
  if (maxFiles === 0 || tokenBudget === 0) return [];
  const reads = collectDroppedReads(dropped, readToolName);
  if (reads.length === 0) return [];
  const visible = collectVisibleReadPaths(kept, readToolName);
  const candidates = reads
    .filter((r) => !visible.has(r.path))
    .sort((a, b) => b.order - a.order)
    .slice(0, maxFiles);
  if (candidates.length === 0) return [];
  const restored: AgentMessage[] = [];
  let spent = 0;
  for (const read of candidates) {
    const message: AgentMessage = {
      role: "user",
      content: `${RESTORED_FILE_PREFIX} ${read.path}\n${read.body}`,
      timestamp: Date.now(),
    };
    const cost = estimateMessageTokens(message);
    if (spent + cost > tokenBudget && restored.length > 0) break;
    if (spent + cost > tokenBudget && restored.length === 0) {
      restored.push(message);
      break;
    }
    restored.push(message);
    spent += cost;
  }
  return restored.reverse();
}