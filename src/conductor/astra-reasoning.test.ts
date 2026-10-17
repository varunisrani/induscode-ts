import { describe, expect, it, vi } from "vitest";
import { ModelCatalog, ModelMatcher } from "./catalog/index.js";
import { createSessionConductor, type AgentLike } from "./conductor.js";

describe("GPT-6 Astra reasoning controls", () => {
  it("cycles only through Astra-supported efforts including max", () => {
    const matcher = new ModelMatcher(new ModelCatalog());
    const model = matcher.resolveCard("openai/gpt-6-astra")!.model;
    const setThinkingLevel = vi.fn();
    const agent: AgentLike = {
      subscribe: () => () => {},
      prompt: async () => {},
      abort: () => {},
      state: { messages: [], model, isStreaming: false },
      replaceMessages: () => {},
      setModel: () => {},
      setSystemPrompt: () => {},
      setTools: () => {},
      setThinkingLevel,
    };
    const conductor = createSessionConductor(
      { modelId: "openai/gpt-6-astra", thinking: "high" as any },
      { agent, matcher },
    );

    expect(conductor.cycleThinkingLevel()).toBe("xhigh");
    expect(conductor.cycleThinkingLevel()).toBe("max");
    expect(conductor.cycleThinkingLevel()).toBe("low");
    expect(setThinkingLevel.mock.calls.map(([level]) => level)).toEqual(["xhigh", "max", "low"]);
  });

  it("keeps the safe legacy ladder for models without explicit effort metadata", () => {
    const matcher = new ModelMatcher(new ModelCatalog());
    const model = matcher.resolveCard("anthropic/claude-sonnet-4-6")!.model;
    const agent: AgentLike = {
      subscribe: () => () => {},
      prompt: async () => {},
      abort: () => {},
      state: { messages: [], model, isStreaming: false },
      replaceMessages: () => {},
      setModel: () => {},
      setSystemPrompt: () => {},
      setTools: () => {},
      setThinkingLevel: () => {},
    };
    const conductor = createSessionConductor(
      { modelId: "anthropic/claude-sonnet-4-6", thinking: "high" },
      { agent, matcher },
    );

    expect(conductor.cycleThinkingLevel()).toBe("off");
  });
});
