import { describe, expect, it } from "vitest";
import { readInvocation } from "./read.js";

describe("readInvocation", () => {
  it("keeps --print --json in one-shot mode", () => {
    const invocation = readInvocation(["--print", "--json", "--", "fix it"]);

    expect(invocation.mode).toBe("json");
    expect(invocation.flags.json).toBe(true);
  });

  it("accepts max reasoning and rejects off for GPT-6 Astra", () => {
    expect(readInvocation([
      "--model", "openai/gpt-6-astra", "--thinking", "max",
    ]).thinking).toBe("max");
    expect(readInvocation([
      "--model", "openai/gpt-6-astra", "--thinking", "off",
    ]).thinking).toBeUndefined();
  });

  it("accepts only high reasoning for GPT-6 Sol on both providers", () => {
    for (const model of ["openai/gpt-6-sol", "openai-codex/gpt-6-sol"]) {
      expect(readInvocation([
        "--model", model, "--thinking", "high",
      ]).thinking).toBe("high");
      expect(readInvocation([
        "--model", model, "--thinking", "xhigh",
      ]).thinking).toBeUndefined();
    }
  });

  it("accepts Luna reasoning from low through max on both OpenAI routes", () => {
    for (const model of ["openai/gpt-6-luna", "openai-codex/gpt-6-luna"]) {
      expect(readInvocation(["--model", model, "--thinking", "low"]).thinking).toBe("low");
      expect(readInvocation(["--model", model, "--thinking", "max"]).thinking).toBe("max");
      expect(readInvocation(["--model", model, "--thinking", "minimal"]).thinking).toBeUndefined();
      expect(readInvocation(["--model", model, "--thinking", "off"]).thinking).toBeUndefined();
      expect(readInvocation(["--model", model]).thinking).toBeUndefined();
    }
  });
});
