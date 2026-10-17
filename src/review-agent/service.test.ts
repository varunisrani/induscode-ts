import { describe, expect, it, vi } from "vitest";
import { ReviewService } from "./service.js";

const job = { id: "job-1", installationId: 77, repository: "acme/widgets", owner: "acme", repo: "widgets", pullNumber: 5, headSha: "head", title: "Change", attempts: 1, maxAttempts: 3, workerId: "worker-1", leaseToken: "11111111-1111-4111-8111-111111111111" };
const context = { repository: "acme/widgets", pullNumber: 5, headSha: "head", baseSha: "base", title: "Change", description: "", author: "dev", additions: 1, deletions: 0, changedFiles: [], diff: "" };
const review = { summary: "Looks good", risk: "low" as const, findings: [], testPlan: ["Run tests"] };

describe("review service", () => {
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

  it("claims, reviews, posts, and completes a job", async () => {
    const store = { claim: vi.fn().mockResolvedValue(job), setCheckRun: vi.fn(), complete: vi.fn(), fail: vi.fn(), markCheckRunComplete: vi.fn() };
    const github = { getPullRequestContext: vi.fn().mockResolvedValue(context), createCheckRun: vi.fn().mockResolvedValue(8), postReview: vi.fn().mockResolvedValue(9), postStickyComment: vi.fn(), completeCheckRun: vi.fn() };
    const reviewer = { review: vi.fn().mockResolvedValue(review) };
    const service = new ReviewService({
      store: store as any,
      tokenProvider: { installationToken: vi.fn().mockResolvedValue("token") },
      githubFactory: () => github as any,
      reviewer: reviewer as any,
      workerId: "worker-1",
      logger,
    });
    expect(await service.runOnce()).toBe(true);
    expect(reviewer.review).toHaveBeenCalledWith(context, github);
    expect(store.complete).toHaveBeenCalledWith(job, review, 9, undefined);
    expect(github.completeCheckRun).toHaveBeenCalledWith("acme", "widgets", 8, review, "success");
    expect(store.markCheckRunComplete).toHaveBeenCalledWith("job-1");
  });

  it("falls back to a sticky comment when the formal review is rejected", async () => {
    const store = { claim: vi.fn().mockResolvedValue(job), setCheckRun: vi.fn(), complete: vi.fn(), fail: vi.fn() };
    const github = { getPullRequestContext: vi.fn().mockResolvedValue(context), createCheckRun: vi.fn().mockRejectedValue(new Error("no checks")), postReview: vi.fn().mockRejectedValue(new Error("invalid line")), postStickyComment: vi.fn().mockResolvedValue(10), completeCheckRun: vi.fn() };
    const service = new ReviewService({ store: store as any, tokenProvider: { installationToken: async () => "token" }, githubFactory: () => github as any, reviewer: { review: async () => review } as any, workerId: "worker-1", logger });
    await service.runOnce();
    expect(store.complete).toHaveBeenCalledWith(job, review, undefined, 10);
  });

  it("completes an existing check run as failed when review generation fails", async () => {
    const store = { claim: vi.fn().mockResolvedValue(job), setCheckRun: vi.fn(), complete: vi.fn(), fail: vi.fn() };
    const github = {
      createCheckRun: vi.fn().mockResolvedValue(8),
      getPullRequestContext: vi.fn().mockRejectedValue(new Error("GitHub unavailable")),
      completeCheckRun: vi.fn(),
    };
    const service = new ReviewService({
      store: store as any,
      tokenProvider: { installationToken: async () => "token" },
      githubFactory: () => github as any,
      reviewer: { review: vi.fn() } as any,
      workerId: "worker-1",
      logger,
    });

    await service.runOnce();

    expect(store.fail).toHaveBeenCalledWith(job, "GitHub unavailable", true);
    expect(github.completeCheckRun).toHaveBeenCalledWith(
      "acme",
      "widgets",
      8,
      expect.objectContaining({ risk: "high", summary: "GitHub unavailable" }),
      "failure",
    );
  });

  it("does not retry a job for a superseded pull request head", async () => {
    const store = { claim: vi.fn().mockResolvedValue(job), setCheckRun: vi.fn(), complete: vi.fn(), fail: vi.fn() };
    const github = {
      createCheckRun: vi.fn().mockRejectedValue(new Error("no checks")),
      getPullRequestContext: vi.fn().mockResolvedValue({ ...context, headSha: "new-head" }),
    };
    const service = new ReviewService({
      store: store as any,
      tokenProvider: { installationToken: async () => "token" },
      githubFactory: () => github as any,
      reviewer: { review: vi.fn() } as any,
      workerId: "worker-1",
      logger,
    });

    await service.runOnce();

    expect(store.fail).toHaveBeenCalledWith(job, expect.stringContaining("stale review job"), false);
  });

  it("reconciles a completed job whose GitHub check update previously failed", async () => {
    const pendingCheck = { id: "job-1", installationId: 77, owner: "acme", repo: "widgets", checkRunId: 8, review };
    const store = {
      claim: vi.fn(), setCheckRun: vi.fn(), complete: vi.fn(), fail: vi.fn(), markCheckRunComplete: vi.fn(),
      nextCheckRunReconciliation: vi.fn().mockResolvedValue(pendingCheck),
    };
    const github = { completeCheckRun: vi.fn() };
    const service = new ReviewService({
      store: store as any,
      tokenProvider: { installationToken: async () => "token" },
      githubFactory: () => github as any,
      reviewer: { review: vi.fn() } as any,
      workerId: "worker-1",
      logger,
    });

    expect(await service.reconcileCheckRunOnce()).toBe(true);
    expect(github.completeCheckRun).toHaveBeenCalledWith("acme", "widgets", 8, review, "success");
    expect(store.markCheckRunComplete).toHaveBeenCalledWith("job-1");
  });

  it("renews the lease while a review is still running", async () => {
    vi.useFakeTimers();
    let finishReview!: (value: typeof review) => void;
    const reviewPromise = new Promise<typeof review>((resolve) => { finishReview = resolve; });
    const store = {
      claim: vi.fn().mockResolvedValue(job), setCheckRun: vi.fn(), complete: vi.fn(), fail: vi.fn(),
      markCheckRunComplete: vi.fn(), nextCheckRunReconciliation: vi.fn(), renewLease: vi.fn().mockResolvedValue(true),
    };
    const github = {
      createCheckRun: vi.fn().mockRejectedValue(new Error("no checks")),
      getPullRequestContext: vi.fn().mockResolvedValue(context),
      postReview: vi.fn().mockResolvedValue(9), postStickyComment: vi.fn(),
    };
    const service = new ReviewService({
      store: store as any,
      tokenProvider: { installationToken: async () => "token" },
      githubFactory: () => github as any,
      reviewer: { review: () => reviewPromise } as any,
      workerId: "worker-1", logger, leaseHeartbeatMs: 10,
    });

    const running = service.runOnce();
    await vi.advanceTimersByTimeAsync(20);
    expect(store.renewLease).toHaveBeenCalledWith(job, 300);
    finishReview(review);
    await running;
    vi.useRealTimers();
  });

  it("reuses a persisted check run after a retry", async () => {
    const retryJob = { ...job, checkRunId: 8 };
    const store = {
      claim: vi.fn().mockResolvedValue(retryJob), setCheckRun: vi.fn(), complete: vi.fn(), fail: vi.fn(),
      markCheckRunComplete: vi.fn(), nextCheckRunReconciliation: vi.fn(), renewLease: vi.fn(),
    };
    const github = {
      createCheckRun: vi.fn(), getPullRequestContext: vi.fn().mockResolvedValue(context),
      postReview: vi.fn().mockResolvedValue(9), completeCheckRun: vi.fn(),
    };
    const service = new ReviewService({
      store: store as any, tokenProvider: { installationToken: async () => "token" },
      githubFactory: () => github as any, reviewer: { review: async () => review } as any,
      workerId: "worker-1", logger,
    });

    await service.runOnce();

    expect(github.createCheckRun).not.toHaveBeenCalled();
    expect(github.completeCheckRun).toHaveBeenCalledWith("acme", "widgets", 8, review, "success");
  });

  it("stops before review generation when check persistence proves the lease was lost", async () => {
    const reviewer = { review: vi.fn() };
    const store = {
      claim: vi.fn().mockResolvedValue(job),
      setCheckRun: vi.fn().mockRejectedValue(new Error("review job lease ownership was lost")),
      complete: vi.fn(), fail: vi.fn(), markCheckRunComplete: vi.fn(),
      nextCheckRunReconciliation: vi.fn(), renewLease: vi.fn(),
    };
    const github = { createCheckRun: vi.fn().mockResolvedValue(8), getPullRequestContext: vi.fn() };
    const service = new ReviewService({
      store: store as any, tokenProvider: { installationToken: async () => "token" },
      githubFactory: () => github as any, reviewer: reviewer as any, workerId: "worker-1", logger,
    });

    await service.runOnce();

    expect(reviewer.review).not.toHaveBeenCalled();
    expect(store.fail).not.toHaveBeenCalled();
  });
});
