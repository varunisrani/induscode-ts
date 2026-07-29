/**
 * `codex-cli` bridge — drives an OpenAI-flavoured CLI emitting `--json`
 * turn/item events.
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

const ADAPTER: RuntimeAdapterId = "codex-cli";
const CONTINUE = { status: "continue" } as const;
const DONE = { status: "done" } as const;

function parseArguments(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    if (value.length === 0) return {};
    try {
      const parsed = JSON.parse(value);
      return asRecord(parsed) ?? {};
    } catch {
      return {};
    }
  }
  return asRecord(value) ?? {};
}

function toolCallFromItem(item: Record<string, unknown>): ToolCall | undefined {
  const name = strField(item, "name");
  if (name === undefined) return undefined;
  const id = strField(item, "call_id") ?? strField(item, "id") ?? name;
  return {
    type: "toolCall",
    id,
    name,
    arguments: parseArguments(item["arguments"]),
  };
}

function isToolItem(item: Record<string, unknown>): boolean {
  const itemType = strField(item, "type");
  return itemType === "function_call" || itemType === "tool_call";
}

function makeParser(): ChildParser {
  let sawToolCall = false;
  const handleCompletedItem = (item: Record<string, unknown>, sink: {
    toolCall: (call: ToolCall) => void;
    text: (delta: string) => void;
  }): void => {
    if (isToolItem(item)) {
      const call = toolCallFromItem(item);
      if (call) {
        sink.toolCall(call);
        sawToolCall = true;
      }
      return;
    }
    const text = strField(item, "text");
    if (text !== undefined && text.length > 0) sink.text(text);
  };
  return (message, sink) => {
    const payload = asRecord(message.payload);
    if (!payload) return CONTINUE;
    const type = strField(payload, "type");
    switch (type) {
      case "thread.started": {
        const threadId = strField(payload, "thread_id");
        if (threadId !== undefined) {
          sink.emit({ kind: "resume", resumeToken: threadId });
        }
        return CONTINUE;
      }
      case "response.output_text.delta": {
        const delta = strField(payload, "delta");
        if (delta !== undefined) sink.text(delta);
        return CONTINUE;
      }
      case "response.reasoning_text.delta":
      case "response.reasoning.delta": {
        const delta = strField(payload, "delta");
        if (delta !== undefined) sink.thinking(delta);
        return CONTINUE;
      }
      case "response.output_item.done":
      case "item.completed": {
        const item = asRecord(payload["item"]);
        if (item) handleCompletedItem(item, sink);
        return CONTINUE;
      }
      case "error":
      case "turn.failed": {
        const error = asRecord(payload["error"]);
        const detail =
          (error && strField(error, "message")) ??
          strField(payload, "message") ??
          "codex-cli error";
        sink.finishError({ message: detail, cause: payload["error"] ?? payload });
        return DONE;
      }
      case "turn.completed":
      case "response.completed": {
        const reason = sawToolCall ? "toolUse" : "stop";
        sink.finishSuccess(reason);
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
      type: "turn",
      context,
      thread: opts.resume,
      cwd: opts.cwd,
      sessionId: opts.sessionId,
    },
  };
}

export const codexCliBridge: RuntimeBridge = {
  adapter: ADAPTER,
  runExchange(model, context, opts, transport) {
    return driveExchange(model, opts, transport, openingRequest(context, opts), makeParser());
  },
  requiresCredential(spec: ExternalRuntimeSpec): boolean {
    return spec.authMode === "api-key";
  },
};