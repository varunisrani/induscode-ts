import { describe, expect, it, vi } from "vitest";
import { GitHubClient, changedLineMap } from "./github.js";

const diff = `diff --git a/src/a.ts b/src/a.ts
--- a/src/a.ts
+++ b/src/a.ts
@@ -10,3 +10,4 @@
 keep
-old
+new
+added
 keep2`;

describe("GitHub review client", () => {
  it("maps changed left and right lines from a unified diff", () => {
    const lines = changedLineMap(diff).get("src/a.ts");
    expect(lines?.LEFT.has(11)).toBe(true);
    expect(lines?.RIGHT.has(11)).toBe(true);
    expect(lines?.RIGHT.has(12)).toBe(true);
    expect(lines?.RIGHT.has(10)).toBe(false);
  });

  it("fetches PR metadata, files, and diff", async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/pulls/5") && init?.headers && (init.headers as Record<string, string>).Accept === "application/vnd.github.v3.diff") {
        return new Response(diff, { status: 200 });
      }
      if (url.endsWith("/pulls/5/files?per_page=100&page=1")) {
        return Response.json([{ filename: "src/a.ts", status: "modified", additions: 2, deletions: 1, patch: "@@" }]);
      }
      if (url.endsWith("/pulls/5")) {
        return Response.json({ title: "Change A", body: "Body", user: { login: "dev" }, head: { sha: "head" }, base: { sha: "base" }, additions: 2, deletions: 1 });
      }
      return new Response("missing", { status: 404 });
    });
    const client = new GitHubClient("token", fetcher as typeof fetch);
    const context = await client.getPullRequestContext("acme", "widgets", 5);
    expect(context.headSha).toBe("head");
    expect(context.changedFiles).toHaveLength(1);
    expect(context.diff).toContain("src/a.ts");
  });

  it("posts a formal COMMENT review with inline findings", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json([], { status: 200 }))
      .mockResolvedValueOnce(Response.json({ id: 9 }, { status: 200 }));
    const client = new GitHubClient("token", fetcher as typeof fetch);
    await client.postReview("acme", "widgets", 5, "head", {
      summary: "One issue.",
      risk: "medium",
      findings: [{ severity: "high", confidence: 0.9, title: "Bug", path: "src/a.ts", line: 11, side: "RIGHT", body: "Fix it." }],
      testPlan: ["Run tests"],
    });
    const body = JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body));
    expect(body.event).toBe("COMMENT");
    expect(body.comments[0]).toMatchObject({ path: "src/a.ts", line: 11, side: "RIGHT" });
  });

  it("reuses a formal review already posted for the same head SHA", async () => {
    const fetcher = vi.fn(async () => Response.json([
      { id: 9, body: "<!-- indusagi-ai-review:head -->\nExisting review" },
    ], { status: 200 }));
    const client = new GitHubClient("token", fetcher as typeof fetch);

    const id = await client.postReview("acme", "widgets", 5, "head", {
      summary: "One issue.", risk: "medium", findings: [], testPlan: ["Run tests"],
    });

    expect(id).toBe(9);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("creates a check run with a deterministic external job id", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ check_runs: [] }, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ id: 8 }, { status: 200 }));
    const client = new GitHubClient("token", fetcher as typeof fetch);

    await client.createCheckRun("acme", "widgets", "head", "Indusagi Code Review", "job-1");

    const createCall = fetcher.mock.calls[1] as unknown as [string, RequestInit];
    const body = JSON.parse(String(createCall[1].body));
    expect(body).toMatchObject({ head_sha: "head", external_id: "job-1" });
  });

  it("reuses a check run with the same external job id", async () => {
    const fetcher = vi.fn(async () => Response.json({
      check_runs: [{ id: 8, external_id: "job-1" }],
    }, { status: 200 }));
    const client = new GitHubClient("token", fetcher as typeof fetch);

    await expect(client.createCheckRun("acme", "widgets", "head", "Indusagi Code Review", "job-1")).resolves.toBe(8);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("bounds GitHub requests with an abort signal", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return Response.json({ type: "file", content: Buffer.from("ok").toString("base64") });
    });
    const client = new GitHubClient("token", fetcher as typeof fetch, 25);

    await expect(client.readFile("acme", "widgets", "README.md", "head")).resolves.toBe("ok");
  });
});
