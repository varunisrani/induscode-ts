/**
 * The single {@link BridgeEventSink} implementation.
 */
import {
  createAssistantMessageEventStream,
  type AssistantMessage,
  type Usage,
} from "indusagi/ai";
import type {
  BridgeEventSink,
  BridgeFailure,
  FinishReason,
  NormalizedEvent,
  ToolCall,
} from "./contract.js";

export interface BridgeMessageSeed {
  readonly api: AssistantMessage["api"];
  readonly provider: AssistantMessage["provider"];
  readonly model: string;
}

function zeroUsage(): Usage {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

class BridgeSink implements BridgeEventSink {
  readonly stream: ReturnType<typeof createAssistantMessageEventStream>;
  partial: AssistantMessage;
  open: { kind: "text" | "thinking"; index: number } | undefined;
  started = false;
  settled = false;

  constructor(seed: BridgeMessageSeed) {
    this.stream = createAssistantMessageEventStream();
    this.partial = {
      role: "assistant",
      content: [],
      api: seed.api,
      provider: seed.provider,
      model: seed.model,
      usage: zeroUsage(),
      stopReason: "stop",
      timestamp: Date.now(),
    };
  }

  start(): void {
    if (this.started || this.settled) return;
    this.started = true;
    this.stream.pushStart(this.partial);
  }

  text(delta: string): void {
    if (this.settled) return;
    this.start();
    const index = this.ensureOpen("text");
    const block = this.partial.content[index];
    if (block && block.type === "text") {
      block.text += delta;
    }
    this.stream.pushTextDelta(index, delta, this.partial);
  }

  thinking(delta: string): void {
    if (this.settled) return;
    this.start();
    const index = this.ensureOpen("thinking");
    const block = this.partial.content[index];
    if (block && block.type === "thinking") {
      block.thinking += delta;
    }
    this.stream.pushThinkingDelta(index, delta, this.partial);
  }

  toolCall(call: ToolCall): void {
    if (this.settled) return;
    this.start();
    this.closeOpen();
    const index = this.partial.content.length;
    const block = {
      type: "toolCall" as const,
      id: call.id,
      name: call.name,
      arguments: call.arguments,
      ...(call.thoughtSignature !== undefined
        ? { thoughtSignature: call.thoughtSignature }
        : {}),
    };
    this.partial.content.push(block);
    this.stream.pushToolCallStart(index, this.partial);
    this.stream.pushToolCallDelta(index, JSON.stringify(block.arguments), this.partial);
    this.stream.pushToolCallEnd(index, block, this.partial);
  }

  emit(event: NormalizedEvent): void {
    switch (event.kind) {
      case "text":
        this.text(event.delta);
        return;
      case "thinking":
        this.thinking(event.delta);
        return;
      case "tool_call":
        this.toolCall(event.call);
        return;
      case "resume":
        return;
      case "finish":
        this.finishSuccess(event.reason);
        return;
      case "failed":
        this.finishError(event.error);
        return;
    }
  }

  finishSuccess(reason: FinishReason = "stop"): void {
    if (this.settled) return;
    this.start();
    this.closeOpen();
    this.settled = true;
    this.partial.stopReason = reason;
    this.stream.pushDone(reason, this.partial);
  }

  finishError(error: BridgeFailure): void {
    if (this.settled) return;
    this.start();
    this.closeOpen();
    this.settled = true;
    const reason = error.aborted ? "aborted" : "error";
    this.partial.stopReason = reason;
    this.partial.errorMessage = error.message;
    this.stream.pushError(reason, this.partial);
  }

  private ensureOpen(kind: "text" | "thinking"): number {
    if (this.open) {
      if (this.open.kind === kind) return this.open.index;
      this.closeOpen();
    }
    const index = this.partial.content.length;
    if (kind === "text") {
      this.partial.content.push({ type: "text", text: "" });
      this.stream.pushTextStart(index, this.partial);
    } else {
      this.partial.content.push({ type: "thinking", thinking: "" });
      this.stream.pushThinkingStart(index, this.partial);
    }
    this.open = { kind, index };
    return index;
  }

  private closeOpen(): void {
    const open = this.open;
    if (!open) return;
    this.open = undefined;
    const block = this.partial.content[open.index];
    if (open.kind === "text" && block && block.type === "text") {
      this.stream.pushTextEnd(open.index, block.text, this.partial);
    } else if (open.kind === "thinking" && block && block.type === "thinking") {
      this.stream.pushThinkingEnd(open.index, block.thinking, this.partial);
    }
  }
}

/**
 * Construct a {@link BridgeEventSink} seeded with the bound model's identity.
 */
export function createBridgeSink(seed: BridgeMessageSeed): BridgeEventSink {
  return new BridgeSink(seed);
}