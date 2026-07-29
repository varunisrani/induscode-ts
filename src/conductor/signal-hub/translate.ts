import type { AgentEvent, AgentEventType, ExtractAgentEvent } from "indusagi/agent";
import { createZeroUsage } from "indusagi/ai";
import { conductorFault } from "../contract.js";
import type { SessionSignal } from "../contract.js";

type TranslatorRule<TType extends AgentEventType> = (event: ExtractAgentEvent<TType>) => SessionSignal[];
type TranslatorTable = { [K in AgentEventType]: TranslatorRule<K> };

const none = (): SessionSignal[] => [];

function usageOf(message: unknown) {
  if (typeof message === "object" && message !== null && "usage" in message && message.usage != null) return message.usage;
  return createZeroUsage();
}

function faultMessageOf(error: unknown): string {
  if (typeof error === "object" && error !== null && "errorMessage" in error && typeof error.errorMessage === "string") {
    return error.errorMessage;
  }
  return "model stream error";
}

function translateStreamEvent(sub: any): SessionSignal[] {
  switch (sub.type) {
    case "text_delta": return [{ kind: "text", delta: sub.delta }];
    case "thinking_delta": return [{ kind: "thinking", delta: sub.delta }];
    case "error": return [{ kind: "fault", fault: conductorFault("model", faultMessageOf(sub.error), sub.error) }];
    default: return [];
  }
}

function promptTextOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((block) => typeof block === "object" && block !== null && "text" in block && typeof block.text === "string" ? block.text : "").join("");
  }
  return "";
}

export const TRANSLATOR_TABLE: TranslatorTable = {
  agent_start: none,
  agent_end: none,
  turn_start: none,
  message_start: none,
  message_end: (event) => {
    const message = event.message;
    if (message?.role === "user") return [{ kind: "prompt", text: promptTextOf(message.content) }];
    if (message?.role === "assistant" && (message.stopReason === "error" || typeof message.errorMessage === "string")) {
      return [{ kind: "fault", fault: conductorFault("model", message.errorMessage ?? "the model call failed") }];
    }
    return [];
  },
  turn_end: (event) => [{ kind: "turn_end", usage: usageOf(event.message) }],
  message_update: (event) => translateStreamEvent(event.assistantMessageEvent),
  tool_execution_start: (event) => [{ kind: "tool_start", id: event.toolCallId, name: event.toolName }],
  tool_execution_update: (event) => [{
    kind: "tool_update",
    id: event.toolCallId,
    name: event.toolName,
    details: event.partialResult?.details,
  }],
  tool_execution_end: (event) => [{ kind: "tool_end", id: event.toolCallId, ok: !event.isError }],
};

export function translateAgentEvent(event: AgentEvent): SessionSignal[] {
  const rule = TRANSLATOR_TABLE[event.type] as (event: AgentEvent) => SessionSignal[];
  return rule(event);
}
