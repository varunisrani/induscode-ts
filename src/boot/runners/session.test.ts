import { describe, expect, it } from "vitest";
import * as sessionRunner from "./session.js";

describe("session reasoning resolution", () => {
  it("carries max through for Astra and rejects off", () => {
    const resolveThinkingLevel = (sessionRunner as any).resolveThinkingLevel;

    expect(resolveThinkingLevel("max", "openai/gpt-6-astra")).toBe("max");
    expect(resolveThinkingLevel("off", "openai/gpt-6-astra")).toBeUndefined();
    expect(resolveThinkingLevel("off", "anthropic/claude-sonnet-4-6")).toBe("off");
  });
});

describe("session permission resolution", () => {
  it("opens in acceptEdits when no project or global default is configured", () => {
    const store = {
      projectOverrides: () => ({}),
      globalDefaults: () => ({}),
    };

    expect(sessionRunner.resolveDefaultMode(store as any)).toBe("acceptEdits");
  });

  it("keeps an explicitly configured permission mode", () => {
    const store = {
      projectOverrides: () => ({ permissions: { defaultMode: "plan" } }),
      globalDefaults: () => ({ permissions: { defaultMode: "acceptEdits" } }),
    };

    expect(sessionRunner.resolveDefaultMode(store as any)).toBe("plan");
  });
});
