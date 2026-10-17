import { describe, expect, it, vi } from "vitest";
import { SupabaseReviewStore } from "./supabase.js";

const request = {
  deliveryId: "delivery-1",
  action: "opened",
  installationId: 77,
  repository: "acme/widgets",
  owner: "acme",
  repo: "widgets",
  pullNumber: 12,
  headSha: "head123",
  title: "Improve sessions",
  draft: false,
};
const review = { summary: "Done", risk: "low" as const, findings: [], testPlan: ["Run tests"] };
const leasedJob = {
  id: "job-1", installationId: 77, repository: "acme/widgets", owner: "acme", repo: "widgets",
  pullNumber: 12, headSha: "head123", title: "Improve sessions", attempts: 1, maxAttempts: 3,
  workerId: "worker-1", leaseToken: "11111111-1111-4111-8111-111111111111",
};

describe("Supabase review store", () => {
  it("atomically records and enqueues a webhook through one RPC", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([{ job_id: "job-1", duplicate: false }], { status: 200 }));
    const store = new SupabaseReviewStore("https://project.supabase.co", "service-key", fetcher as typeof fetch);

    expect(await store.enqueueWebhook(request, "pull_request")).toEqual({ jobId: "job-1", duplicate: false });
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("/rpc/enqueue_indusagi_review_job");
  });

  it("records a delivery and reports duplicates", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json([{ delivery_id: "delivery-1" }], { status: 201 }))
      .mockResolvedValueOnce(Response.json([], { status: 201 }));
    const store = new SupabaseReviewStore("https://project.supabase.co", "service-key", fetcher as typeof fetch);
    expect(await store.recordDelivery("delivery-1", "pull_request")).toBe(true);
    expect(await store.recordDelivery("delivery-1", "pull_request")).toBe(false);
  });

  it("claims a durable review job", async () => {
    const job = { id: "job-1", installation_id: 77, repository: "acme/widgets", owner: "acme", repo: "widgets", pr_number: 12, head_sha: "head123", title: "Improve sessions", attempts: 1, max_attempts: 3 };
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json([job], { status: 200 }));
    const store = new SupabaseReviewStore("https://project.supabase.co", "service-key", fetcher as typeof fetch);
    const claimed = await store.claim("worker-1");
    expect(claimed?.pullNumber).toBe(12);
    expect(claimed?.headSha).toBe("head123");
  });

  it("marks a non-retryable failure terminal immediately", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([{}], { status: 200 }));
    const store = new SupabaseReviewStore("https://project.supabase.co", "service-key", fetcher as typeof fetch);
    await store.fail(leasedJob, "superseded", false);

    const init = fetcher.mock.calls[0]?.[1] as RequestInit;
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("lease_expires_at=gt.");
    expect(JSON.parse(String(init.body))).toMatchObject({ status: "failed", error: "superseded" });
  });

  it("loads a completed job with an unfinished check run for reconciliation", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([{
      id: "job-1", installation_id: 77, owner: "acme", repo: "widgets", check_run_id: 8, review,
    }], { status: 200 }));
    const store = new SupabaseReviewStore("https://project.supabase.co", "service-key", fetcher as typeof fetch);

    expect(await store.nextCheckRunReconciliation()).toEqual({
      id: "job-1", installationId: 77, owner: "acme", repo: "widgets", checkRunId: 8, review,
    });
  });

  it("rejects completion after the worker loses ownership of the lease", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([], { status: 200 }));
    const store = new SupabaseReviewStore("https://project.supabase.co", "service-key", fetcher as typeof fetch);

    await expect(store.complete(leasedJob, review)).rejects.toThrow(/lease ownership/i);
  });

  it("bounds Supabase requests with an abort signal", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return Response.json([], { status: 200 });
    });
    const store = new SupabaseReviewStore("https://project.supabase.co", "service-key", fetcher as typeof fetch, 25);

    await expect(store.recordDelivery("delivery-1", "ping")).resolves.toBe(false);
  });
});
