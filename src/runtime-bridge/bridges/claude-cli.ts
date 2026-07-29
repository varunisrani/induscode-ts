/**
 * `claude-cli` bridge — drives an Anthropic-flavoured CLI that emits
 * line-delimited stream-json content blocks.
 */
import type {
  Context,
  ExchangeOptions,
  ExternalRuntimeSpec,
  RuntimeAdapterId,
  RuntimeBridge,
  ToolCall,
} from "../contract.js";
import {
  asRecord,
  driveExchange,
  strField,
  type ChildParser,
} from "./_drive.js";

const ADAPTER: RuntimeAdapterId = "claude-cli";
const CONTINUE = { status: "continue" } as const;
const DONE = { status: "done" } as const;

function mapStopReason(raw: string | undefined): "stop" | "length" | "toolUse" {
  switch (raw) {
    case "max_tokens":
      return "length";
    case "tool_use":
      return "toolUse";
    default:
      return "stop";
  }
}

function toolCallFromBlock(block: Record<string, unknown>): ToolCall | undefined {
  const id = strField(block, "id");
  const name = strField(block, "name");
  if (id === undefined || name === undefined) return undefined;
  const input = asRecord(block["input"]) ?? {};
  return { type: "toolCall", id, name, arguments: input };
}

function makeParser(): ChildParser {
  let stopReason: "stop" | "length" | "toolUse" = "stop";
  return (message, sink) => {
    const payload = asRecord(message.payload);
    if (!payload) return CONTINUE;
    const type = strField(payload, "type");
    switch (type) {
      case "system": {
        if (strField(payload, "subtype") === "init") {
          const sessionId = strField(payload, "session_id");
          if (sessionId !== undefined) {
            sink.emit({ kind: "resume", resumeToken: sessionId });
          }
        }
        return CONTINUE;
      }
      case "content_block_start": {
        const block = asRecord(payload["content_block"]);
        if (block && strField(block, "type") === "tool_use") {
          const call = toolCallFromBlock(block);
          if (call) sink.toolCall(call);
        }
        return CONTINUE;
      }
      case "content_block_delta": {
        const delta = asRecord(payload["delta"]);
        if (!delta) return CONTINUE;
        const deltaType = strField(delta, "type");
        if (deltaType === "text_delta") {
          const text = strField(delta, "text");
          if (text !== undefined) sink.text(text);
        } else if (deltaType === "thinking_delta") {
          const thinking = strField(delta, "thinking");
          if (thinking !== undefined) sink.thinking(thinking);
        }
        return CONTINUE;
      }
      case "message_delta": {
        const delta = asRecord(payload["delta"]);
        stopReason = mapStopReason(delta ? strField(delta, "stop_reason") : undefined);
        return CONTINUE;
      }
      case "error": {
        const error = asRecord(payload["error"]);
        const detail =
          (error && strField(error, "message")) ?? "claude-cli error";
        sink.finishError({ message: detail, cause: payload["error"] });
        return DONE;
      }
      case "message_stop":
      case "result": {
        sink.finishSuccess(stopReason);
        return DONE;
      }
      default:
        return CONTINUE;
    }
  };
}

function openingRequest(context: Context, opts: ExchangeOptions): { body: unknown } {
  return {
    body: {
      type: "user",
      context,
      resume: opts.resume,
      cwd: opts.cwd,
      sessionId: opts.sessionId,
    },
  };
}

export const claudeCliBridge: RuntimeBridge = {
  adapter: ADAPTER,
  runExchange(model, context, opts, transport) {
    return driveExchange(model, opts, transport, openingRequest(context, opts), makeParser());
  },
  requiresCredential(spec: ExternalRuntimeSpec): boolean {
    return spec.authMode === "api-key";
  },
};