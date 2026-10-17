import { describe, expect, it } from "vitest";
import { translateAgentEvent } from "./translate.js";

type InputEvent = Parameters<typeof translateAgentEvent>[0];

describe("translateAgentEvent tool signals", () => {
  it("includes tool arguments in tool_start", () => {
    const event: InputEvent = {
      type: "tool_execution_start",
      toolCallId: "call-1",
      toolName: "read",
      args: { path: "README.md" },
    };

    expect(translateAgentEvent(event)).toEqual([{
      kind: "tool_start",
      id: "call-1",
      name: "read",
      args: { path: "README.md" },
    }]);
  });

  it("includes tool results and error status in tool_end", () => {
    const event: InputEvent = {
      type: "tool_execution_end",
      toolCallId: "call-2",
      toolName: "write",
      result: { content: "permission denied" },
      isError: true,
    };

    expect(translateAgentEvent(event)).toEqual([{
      kind: "tool_end",
      id: "call-2",
      ok: false,
      result: { content: "permission denied" },
      isError: true,
    }]);
  });
});

describe("translateAgentEvent preserved signals", () => {
  it("preserves prompt extraction", () => {
    const event = {
      type: "message_end",
      message: {
        role: "user",
        content: [{ type: "text", text: "hello " }, { type: "text", text: "world" }],
        timestamp: 1,
      },
    } as unknown as InputEvent;

    expect(translateAgentEvent(event)).toEqual([{ kind: "prompt", text: "hello world" }]);
  });

  it("preserves text and thinking deltas", () => {
    const message = { role: "assistant", content: [], timestamp: 1 };

    expect(translateAgentEvent({
      type: "message_update",
      message,
      assistantMessageEvent: { type: "text_delta", delta: "answer" },
    } as unknown as InputEvent)).toEqual([{ kind: "text", delta: "answer" }]);
    expect(translateAgentEvent({
      type: "message_update",
      message,
      assistantMessageEvent: { type: "thinking_delta", delta: "reason" },
    } as unknown as InputEvent)).toEqual([{ kind: "thinking", delta: "reason" }]);
  });

  it("preserves turn_end usage", () => {
    const usage = { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, totalTokens: 10, cost: { total: 0.5 } };
    const event = {
      type: "turn_end",
      message: { role: "assistant", content: [], usage, timestamp: 1 },
      toolResults: [],
    } as unknown as InputEvent;

    expect(translateAgentEvent(event)).toEqual([{ kind: "turn_end", usage }]);
  });
});
