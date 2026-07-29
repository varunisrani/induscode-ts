/**
 * Window-budget / microcompact — clear stale tool-result bodies in place.
 */
import type { AgentMessage } from "./contract.js";

/**
 * The placeholder spliced in where a stale tool-result body used to be.
 */
export const CLEARED_TOOL_RESULT = "[Old tool result content cleared]";

/**
 * The wire names of tools whose results are safe to clear once stale.
 */
export const COMPACTABLE_TOOL_NAMES: ReadonlySet<string> = new Set([
  "read",
  "grep",
  "find",
  "ls",
  "glob",
  "bash",
  "websearch",
  "webfetch",
  "edit",
  "write",
]);

const DEFAULT_KEEP_RECENT = 6;

function isRecord3(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectCompactableToolIds(messages: AgentMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const message of messages) {
    if (!isRecord3(message) || message.role !== "assistant") continue;
    const content = Array.isArray(message.content) ? message.content : [];
    for (const block of content) {
      if (!isRecord3(block) || block.type !== "toolCall") continue;
      const name = typeof block.name === "string" ? block.name : "";
      const id = typeof block.id === "string" ? block.id : "";
      if (id.length > 0 && COMPACTABLE_TOOL_NAMES.has(name)) ids.add(id);
    }
  }
  return ids;
}

function isAlreadyCleared(message: AgentMessage): boolean {
  if (!isRecord3(message)) return false;
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content) || content.length !== 1) return false;
  const block = content[0];
  return (
    isRecord3(block) &&
    block.type === "text" &&
    block.text === CLEARED_TOOL_RESULT
  );
}

/**
 * Clear the bodies of stale compactable tool results, keeping the most recent
 * `keepRecent` of them verbatim.
 */
export function clearStaleToolResults(
  messages: AgentMessage[],
  opts: { keepRecent?: number } = {},
): AgentMessage[] {
  const keepRecent = Math.max(1, opts.keepRecent ?? DEFAULT_KEEP_RECENT);
  const compactableIds = collectCompactableToolIds(messages);
  if (compactableIds.size === 0) return messages;
  const clearAt = new Set<number>();
  let kept = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!isRecord3(message) || message.role !== "toolResult") continue;
    const id = typeof (message as { toolCallId?: unknown }).toolCallId === "string"
      ? (message as { toolCallId: string }).toolCallId
      : "";
    if (!compactableIds.has(id)) continue;
    if (kept < keepRecent) {
      kept++;
      continue;
    }
    if (isAlreadyCleared(message as AgentMessage)) continue;
    clearAt.add(i);
  }
  if (clearAt.size === 0) return messages;
  return messages.map((message, i) => {
    if (!clearAt.has(i)) return message;
    return {
      ...message,
      content: [{ type: "text", text: CLEARED_TOOL_RESULT }],
    };
  });
}