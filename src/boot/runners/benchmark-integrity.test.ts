import { describe, expect, it, vi } from "vitest";
import type { AgentTool } from "../../addons/index.js";
import { wrapToolsForTerminalBench } from "./benchmark-integrity.js";

function tool(name: string): AgentTool {
  return {
    name,
    label: name,
    description: name,
    parameters: {} as never,
    execute: vi.fn(async () => ({ content: [{ type: "text" as const, text: "ran" }] })),
  };
}

describe("Terminal-Bench integrity tool guard", () => {
  it("is an identity-preserving no-op outside the benchmark profile", () => {
    const original = tool("read");
    expect(wrapToolsForTerminalBench([original], "/app", {})).toEqual([original]);
  });

  it("blocks dedicated file tools from benchmark-owned absolute paths", async () => {
    for (const [name, args] of [
      ["read", { path: "/tests/test_outputs.py" }],
      ["grep", { pattern: "expected", path: "/tests" }],
      ["find", { pattern: "*", path: "/solution" }],
      ["ls", { path: "/tests" }],
      ["write", { path: "/reward.txt", content: "1" }],
      ["edit", { path: "/solution.sh", old_string: "a", new_string: "b" }],
    ] as const) {
      const original = tool(name);
      const [guarded] = wrapToolsForTerminalBench([original], "/app", { INDUSAGI_BENCHMARK_PROFILE: "terminal-bench" });
      const result = await guarded.execute("call-1", args as never);
      expect(result.isError).toBe(true);
      expect(original.execute).not.toHaveBeenCalled();
    }
  });

  it("allows normal project files and project tests inside the workspace", async () => {
    const original = tool("read");
    const [guarded] = wrapToolsForTerminalBench([original], "/app", { INDUSAGI_BENCHMARK_PROFILE: "terminal-bench" });
    const result = await guarded.execute("call-2", { path: "/app/tests/unit.test.ts" } as never);
    expect(result.isError).not.toBe(true);
    expect(original.execute).toHaveBeenCalledOnce();
  });

  it("blocks shell access to verifier, solution, reward, and broad root traversal", async () => {
    for (const command of [
      "cat /tests/test_outputs.py",
      "bash /solution.sh",
      "cat /reward.txt",
      "find / -name '*.sh'",
      "ls -la /tests",
    ]) {
      const original = tool("bash");
      const [guarded] = wrapToolsForTerminalBench([original], "/app", { INDUSAGI_BENCHMARK_PROFILE: "terminal-bench" });
      const result = await guarded.execute("call-3", { command } as never);
      expect(result.isError).toBe(true);
      expect(original.execute).not.toHaveBeenCalled();
    }
  });

  it("blocks shell retrieval of online Terminal-Bench solution material", async () => {
    const original = tool("bash");
    const [guarded] = wrapToolsForTerminalBench([original], "/app", { INDUSAGI_BENCHMARK_PROFILE: "terminal-bench" });
    const result = await guarded.execute("call-4", {
      command: "curl https://example.com/terminal-bench/fix-git/solution.sh",
    } as never);
    expect(result.isError).toBe(true);
    expect(original.execute).not.toHaveBeenCalled();
  });

  it("allows ordinary build and test shell commands", async () => {
    const original = tool("bash");
    const [guarded] = wrapToolsForTerminalBench([original], "/app", { INDUSAGI_BENCHMARK_PROFILE: "terminal-bench" });
    const result = await guarded.execute("call-5", { command: "npm test && pytest -q" } as never);
    expect(result.isError).not.toBe(true);
    expect(original.execute).toHaveBeenCalledOnce();
  });
});
