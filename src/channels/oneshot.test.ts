import { describe, expect, it } from "vitest";
import { ndjsonFramer } from "./framer.js";
import { inertDialog, runOneshot } from "./oneshot.js";
import type { ChannelContext } from "./contract.js";

function fakeContext(lines: string[]): ChannelContext {
  let subscriber: ((signal: unknown) => void) | undefined;
  const state = {
    phase: "idle",
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    fault: undefined,
  };
  const conductor = {
    subscribe(handler: (signal: unknown) => void) {
      subscriber = handler;
      return () => {
        subscriber = undefined;
      };
    },
    snapshot() {
      return state;
    },
    async submit() {
      subscriber?.({ kind: "tool_start", id: "call-1", name: "bash", args: { command: "yes" } });
      subscriber?.({
        kind: "tool_update",
        id: "call-1",
        name: "bash",
        details: { truncation: { content: "x".repeat(64 * 1024) } },
      });
      subscriber?.({
        kind: "tool_end",
        id: "call-1",
        name: "bash",
        ok: true,
        result: { content: [{ type: "text", text: "done" }] },
        isError: false,
      });
      return state;
    },
  };
  return {
    conductor: conductor as never,
    out: {
      write(chunk: string) {
        lines.push(chunk);
        return true;
      },
    },
    framer: ndjsonFramer,
    dialog: inertDialog,
  };
}

describe("one-shot NDJSON output", () => {
  it("does not serialize unbounded tool progress snapshots", async () => {
    const lines: string[] = [];

    const code = await runOneshot(fakeContext(lines), { shape: "ndjson", prompts: ["work"] });
    const records = lines.flatMap((chunk) =>
      chunk
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as { name?: string }),
    );

    expect(code).toBe(0);
    expect(records.some((record) => record.name === "tool_start")).toBe(true);
    expect(records.some((record) => record.name === "tool_end")).toBe(true);
    expect(records.some((record) => record.name === "tool_update")).toBe(false);
    expect(lines.join("").length).toBeLessThan(4096);
  });
});
