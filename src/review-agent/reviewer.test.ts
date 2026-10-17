import { describe, expect, it, vi } from "vitest";
import { runReviewTurn, validateFindings } from "./reviewer.js";

const context = {
  repository: "acme/widgets",
  pullNumber: 5,
  headSha: "head",
  baseSha: "base",
  title: "Change A",
  description: "Body",
  author: "dev",
  additions: 2,
  deletions: 1,
  changedFiles: [{ filename: "src/a.ts", status: "modified", additions: 2, deletions: 1 }],
  diff: "diff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -10,2 +10,3 @@\n-old\n+new\n+added\n keep",
};

describe("Indusagi reviewer", () => {
  it("collects streamed conductor text and parses the final review", async () => {
    let subscriber: ((signal: any) => void) | undefined;
    const conductor = {
      subscribe(fn: (signal: any) => void) { subscriber = fn; return () => { subscriber = undefined; }; },
      async submit() {
        subscriber?.({ kind: "text", delta: '{"summary":"Looks risky","risk":"medium",' });
        subscriber?.({ kind: "text", delta: '"findings":[],"testPlan":["Run tests"]}' });
        return { phase: "idle" };
      },
    };
    const result = await runReviewTurn(context, conductor as any);
    expect(result.summary).toBe("Looks risky");
  });

  it("drops low-confidence, duplicate, and non-diff findings", () => {
    const validated = validateFindings({
      summary: "x",
      risk: "high",
      findings: [
        { severity: "high", confidence: 0.95, title: "Bug", path: "src/a.ts", line: 10, side: "RIGHT", body: "x" },
        { severity: "high", confidence: 0.95, title: "Bug", path: "src/a.ts", line: 10, side: "RIGHT", body: "duplicate" },
        { severity: "low", confidence: 0.5, title: "Maybe", path: "src/a.ts", line: 11, side: "RIGHT", body: "x" },
        { severity: "high", confidence: 0.99, title: "Wrong line", path: "src/a.ts", line: 99, side: "RIGHT", body: "x" },
      ],
      testPlan: [],
    }, context.diff);
    expect(validated.findings).toHaveLength(1);
    expect(validated.findings[0]?.line).toBe(10);
  });

  it("aborts a review turn that exceeds its deadline", async () => {
    const conductor = {
      subscribe: () => () => undefined,
      submit: () => new Promise(() => undefined),
      abort: vi.fn(),
    };

    await expect(runReviewTurn(context, conductor as any, 5)).rejects.toThrow(/timed out/i);
    expect(conductor.abort).toHaveBeenCalledOnce();
  });
});
