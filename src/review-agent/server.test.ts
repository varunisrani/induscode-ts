import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebhookHandler, createWorkerPoll } from "./server.js";

const openServers: ReturnType<typeof createServer>[] = [];
afterEach(async () => {
  await Promise.all(openServers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("GitHub webhook HTTP boundary", () => {
  it("verifies, persists, and enqueues a pull request delivery", async () => {
    const store = {
      recordDelivery: vi.fn(async () => true),
      enqueueWebhook: vi.fn(async () => ({ jobId: "job-1", duplicate: false })),
    };
    const poll = vi.fn(async () => undefined);
    const config = {
      githubWebhookSecret: "secret",
    };
    const handler = createWebhookHandler(config, { store, poll });
    const server = createServer(handler);
    openServers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server port");

    const payload = JSON.stringify({
      action: "opened",
      installation: { id: 77 },
      repository: { full_name: "acme/widgets" },
      pull_request: { number: 5, draft: false, title: "Fix", head: { sha: "head" } },
    });
    const signature = `sha256=${createHmac("sha256", "secret").update(payload).digest("hex")}`;
    const response = await fetch(`http://127.0.0.1:${address.port}/webhooks/github`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-github-event": "pull_request",
        "x-github-delivery": "delivery-1",
        "x-hub-signature-256": signature,
      },
      body: payload,
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true, jobId: "job-1" });
    expect(store.recordDelivery).not.toHaveBeenCalled();
    expect(store.enqueueWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ repository: "acme/widgets", pullNumber: 5 }),
      "pull_request",
    );
    expect(poll).toHaveBeenCalledOnce();
  });

  it("periodically recovers expired worker leases", async () => {
    let now = 0;
    const runtime = {
      store: { recoverStaleJobs: vi.fn() },
      service: { runOnce: vi.fn().mockResolvedValue(false), reconcileCheckRunOnce: vi.fn() },
    };
    const poll = createWorkerPoll({ maxJobsPerTick: 5 }, runtime as any, {
      recoveryIntervalMs: 60_000,
      now: () => now,
      logger: { error: vi.fn() },
    });

    await poll();
    await poll();
    now = 60_001;
    await poll();

    expect(runtime.store.recoverStaleJobs).toHaveBeenCalledTimes(2);
  });
});
