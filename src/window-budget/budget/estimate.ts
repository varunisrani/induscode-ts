/**
 * Token estimation — the heuristic "meter stick" for the window-budget
 * subsystem.
 *
 * Before we can decide whether the transcript is over budget (gate.ts) or where
 * to slice it (slice.ts), we need a cheap, deterministic estimate of how many
 * tokens each {@link AgentMessage} occupies. We do *not* call a tokenizer; we
 * walk the serialized content and apply a small, transparent weighting model.
 */
import type { AgentMessage } from "../contract.js";

const CHARS_PER_TOKEN = 3.6;
const IMAGE_TOKENS = 1024;
const MESSAGE_FRAMING_TOKENS = 4;
const BLOCK_FRAMING_TOKENS = 2;
const TOOLCALL_ENVELOPE_TOKENS = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}

function weighBlock(block: unknown): { chars: number; images: number } {
  if (typeof block === "string") return { chars: block.length, images: 0 };
  if (!isRecord(block)) return { chars: 0, images: 0 };
  switch (block.type) {
    case "text":
      return { chars: typeof block.text === "string" ? block.text.length : 0, images: 0 };
    case "thinking":
      return { chars: typeof block.thinking === "string" ? block.thinking.length : 0, images: 0 };
    case "image":
      return { chars: 0, images: 1 };
    case "toolCall": {
      const name = typeof block.name === "string" ? block.name.length : 0;
      const args = block.arguments === undefined ? 0 : safeStringify(block.arguments).length;
      return { chars: name + args, images: 0 };
    }
    default:
      return { chars: safeStringify(block).length, images: 0 };
  }
}

function weighMessage(message: unknown): { chars: number; images: number; framing: number } {
  if (!isRecord(message)) {
    return { chars: safeStringify(message).length, images: 0, framing: MESSAGE_FRAMING_TOKENS };
  }
  let chars = 0;
  let images = 0;
  let framing = MESSAGE_FRAMING_TOKENS;
  switch (message.role) {
    case "user": {
      const content = message.content;
      if (typeof content === "string") {
        chars += content.length;
        framing += BLOCK_FRAMING_TOKENS;
      } else if (Array.isArray(content)) {
        for (const block of content) {
          const w = weighBlock(block);
          chars += w.chars;
          images += w.images;
          framing += BLOCK_FRAMING_TOKENS;
        }
      }
      return { chars, images, framing };
    }
    case "assistant": {
      const content = Array.isArray(message.content) ? message.content : [];
      for (const block of content) {
        const w = weighBlock(block);
        chars += w.chars;
        images += w.images;
        framing += BLOCK_FRAMING_TOKENS;
        if (isRecord(block) && block.type === "toolCall") framing += TOOLCALL_ENVELOPE_TOKENS;
      }
      if (typeof message.errorMessage === "string") chars += message.errorMessage.length;
      return { chars, images, framing };
    }
    case "toolResult": {
      if (typeof message.toolName === "string") chars += message.toolName.length;
      const content = Array.isArray(message.content) ? message.content : [];
      for (const block of content) {
        const w = weighBlock(block);
        chars += w.chars;
        images += w.images;
        framing += BLOCK_FRAMING_TOKENS;
      }
      framing += TOOLCALL_ENVELOPE_TOKENS;
      return { chars, images, framing };
    }
    default: {
      chars += safeStringify(message).length;
      framing += BLOCK_FRAMING_TOKENS;
      return { chars, images, framing };
    }
  }
}

/**
 * Estimate the token cost of one message in isolation. Exposed so the slice
 * planner can build a prefix-sum without re-deriving the per-message weight.
 */
export function estimateMessageTokens(message: AgentMessage): number {
  const { chars, images, framing } = weighMessage(message);
  const textTokens = Math.ceil(chars / CHARS_PER_TOKEN);
  return textTokens + framing + images * IMAGE_TOKENS;
}

/**
 * Estimate the total token cost of a transcript: the sum of every message's
 * {@link estimateMessageTokens}.
 */
export function estimateTokens(messages: AgentMessage[]): number {
  let total = 0;
  for (const message of messages) total += estimateMessageTokens(message);
  return total;
}

/**
 * Build a FORWARD prefix-sum array of per-message token estimates.
 */
export function prefixTokens(messages: AgentMessage[]): number[] {
  const prefix = new Array<number>(messages.length + 1);
  prefix[0] = 0;
  for (let i = 0; i < messages.length; i++) {
    prefix[i + 1] = prefix[i] + estimateMessageTokens(messages[i]);
  }
  return prefix;
}