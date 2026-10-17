#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadReviewAgentConfig, type ReviewAgentConfig } from "./config.js";
import { GitHubAppTokenProvider } from "./github.js";
import { IndusagiReviewer } from "./reviewer.js";
import { ReviewService } from "./service.js";
import { SupabaseReviewStore } from "./supabase.js";
import type { ReviewRequest } from "./contract.js";
import { parsePullRequestWebhook, verifyGithubSignature } from "./webhook.js";

const MAX_WEBHOOK_BYTES = 2 * 1024 * 1024;

function json(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) });
  res.end(data);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const declared = Number(req.headers["content-length"] ?? 0);
  if (declared > MAX_WEBHOOK_BYTES) throw new Error("payload_too_large");
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_WEBHOOK_BYTES) throw new Error("payload_too_large");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

class StaticTokenProvider {
  constructor(private readonly token: string) {}
  async installationToken(): Promise<string> { return this.token; }
}

export function createReviewAgentRuntime(config: ReviewAgentConfig) {
  const store = new SupabaseReviewStore(config.supabaseUrl, config.supabaseServiceKey);
  const tokenProvider = config.githubApp
    ? new GitHubAppTokenProvider(config.githubApp.appId, config.githubApp.privateKey)
    : new StaticTokenProvider(config.githubToken!);
  const reviewer = new IndusagiReviewer({
    modelId: config.modelId,
    thinking: "high",
    getApiKey: (provider) => config.providerKeys[provider],
  });
  const service = new ReviewService({
    store,
    tokenProvider,
    reviewer,
    workerId: `${process.env.HOSTNAME ?? "local"}-${process.pid}-${randomUUID().slice(0, 8)}`,
  });
  return { store, service };
}

interface WebhookRuntime {
  store: {
    recordDelivery(deliveryId: string, eventName: string): Promise<boolean>;
    enqueueWebhook(request: ReviewRequest, eventName: string): Promise<{ jobId?: string; duplicate: boolean }>;
  };
  poll: () => Promise<unknown>;
}

export function createWebhookHandler(
  config: Pick<ReviewAgentConfig, "githubWebhookSecret" | "githubApp">,
  runtime: WebhookRuntime,
) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      if (req.method === "GET" && url.pathname === "/healthz") {
        json(res, 200, { ok: true, service: "indusagi-review-agent" });
        return;
      }
      if (req.method !== "POST" || url.pathname !== "/webhooks/github") {
        json(res, 404, { error: "not_found" });
        return;
      }

      const payload = await readBody(req);
      const signature = typeof req.headers["x-hub-signature-256"] === "string"
        ? req.headers["x-hub-signature-256"]
        : null;
      if (!verifyGithubSignature(payload, signature, config.githubWebhookSecret)) {
        json(res, 401, { error: "invalid_signature" });
        return;
      }

      const eventName = typeof req.headers["x-github-event"] === "string" ? req.headers["x-github-event"] : "";
      const deliveryId = typeof req.headers["x-github-delivery"] === "string" ? req.headers["x-github-delivery"] : "";
      if (!deliveryId) {
        json(res, 400, { error: "missing_delivery_id" });
        return;
      }
      if (eventName === "ping") {
        if (!await runtime.store.recordDelivery(deliveryId, eventName)) {
          json(res, 202, { accepted: true, duplicate: true });
          return;
        }
        json(res, 200, { ok: true, message: "pong" });
        return;
      }
      if (eventName !== "pull_request") {
        if (!await runtime.store.recordDelivery(deliveryId, eventName || "unknown")) {
          json(res, 202, { accepted: true, duplicate: true });
          return;
        }
        json(res, 202, { accepted: true, ignored: true });
        return;
      }

      const request = parsePullRequestWebhook(payload, deliveryId, {
        allowMissingInstallation: !config.githubApp,
      });
      if (!request) {
        if (!await runtime.store.recordDelivery(deliveryId, eventName)) {
          json(res, 202, { accepted: true, duplicate: true });
          return;
        }
        json(res, 202, { accepted: true, ignored: true });
        return;
      }
      const result = await runtime.store.enqueueWebhook(request, eventName);
      if (result.duplicate) {
        json(res, 202, { accepted: true, duplicate: true });
        return;
      }
      json(res, 202, { accepted: true, jobId: result.jobId });
      void runtime.poll();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "payload_too_large") {
        json(res, 413, { error: message });
      } else {
        console.error(`[review-agent] request failed: ${message}`);
        json(res, 500, { error: "internal_error" });
      }
    }
  };
}

interface WorkerRuntime {
  store: Pick<SupabaseReviewStore, "recoverStaleJobs">;
  service: Pick<ReviewService, "runOnce" | "reconcileCheckRunOnce">;
}

export function createWorkerPoll(
  config: Pick<ReviewAgentConfig, "maxJobsPerTick">,
  runtime: WorkerRuntime,
  options: {
    recoveryIntervalMs?: number;
    now?: () => number;
    logger?: Pick<Console, "error">;
  } = {},
) {
  const recoveryIntervalMs = options.recoveryIntervalMs ?? 60_000;
  const now = options.now ?? Date.now;
  const logger = options.logger ?? console;
  let workerBusy = false;
  let lastRecoveryAt = Number.NEGATIVE_INFINITY;

  return async (): Promise<void> => {
    if (workerBusy) return;
    workerBusy = true;
    try {
      const currentTime = now();
      if (currentTime - lastRecoveryAt >= recoveryIntervalMs) {
        await runtime.store.recoverStaleJobs();
        lastRecoveryAt = currentTime;
      }
      for (let index = 0; index < config.maxJobsPerTick; index++) {
        if (!await runtime.service.runOnce()) break;
      }
      await runtime.service.reconcileCheckRunOnce();
    } catch (error) {
      logger.error(`[review-agent] worker poll failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      workerBusy = false;
    }
  };
}

export async function startReviewAgentServer(config = loadReviewAgentConfig()) {
  const runtime = createReviewAgentRuntime(config);
  const poll = createWorkerPoll(config, runtime);
  const timer = setInterval(() => void poll(), config.pollIntervalMs);
  timer.unref();
  void poll();

  const server = createServer(createWebhookHandler(config, { store: runtime.store, poll }));

  await new Promise<void>((resolve) => server.listen(config.port, config.host, resolve));
  console.log(`[review-agent] listening on http://${config.host}:${config.port}`);

  const close = async () => {
    clearInterval(timer);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
  return { server, close, config };
}

function isProgramEntry(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try { return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}

if (isProgramEntry()) {
  startReviewAgentServer().then(({ close }) => {
    const shutdown = () => void close().finally(() => process.exit(0));
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }).catch((error) => {
    process.stderr.write(`indusagi-review-agent: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
