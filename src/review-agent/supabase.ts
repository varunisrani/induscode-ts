import type { ReviewOutput, ReviewRequest } from "./contract.js";

export interface ReviewJob {
  id: string;
  installationId: number;
  repository: string;
  owner: string;
  repo: string;
  pullNumber: number;
  headSha: string;
  title: string;
  attempts: number;
  maxAttempts: number;
  workerId: string;
  leaseToken: string;
  checkRunId?: number;
}

export interface CheckRunReconciliation {
  id: string;
  installationId: number;
  owner: string;
  repo: string;
  checkRunId: number;
  review: ReviewOutput;
}

function toJob(row: Record<string, any>): ReviewJob {
  return {
    id: String(row.id),
    installationId: Number(row.installation_id),
    repository: String(row.repository),
    owner: String(row.owner),
    repo: String(row.repo),
    pullNumber: Number(row.pr_number),
    headSha: String(row.head_sha),
    title: String(row.title),
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 3),
    workerId: String(row.worker_id ?? ""),
    leaseToken: String(row.lease_token ?? ""),
    ...(row.check_run_id != null ? { checkRunId: Number(row.check_run_id) } : {}),
  };
}

export class SupabaseReviewStore {
  private readonly baseUrl: string;

  constructor(
    url: string,
    private readonly serviceKey: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly requestTimeoutMs = 30_000,
  ) {
    this.baseUrl = url.replace(/\/$/, "");
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(this.requestTimeoutMs),
      headers: {
        apikey: this.serviceKey,
        Authorization: `Bearer ${this.serviceKey}`,
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (!response.ok) {
      throw new Error(`Supabase ${init.method ?? "GET"} ${path} failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
    }
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  async recordDelivery(deliveryId: string, eventName: string): Promise<boolean> {
    const rows = await this.request<Array<Record<string, unknown>>>(
      "/rest/v1/indusagi_review_deliveries?on_conflict=delivery_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({ delivery_id: deliveryId, event_name: eventName }),
      },
    );
    return rows.length > 0;
  }

  async enqueueWebhook(request: ReviewRequest, eventName: string): Promise<{ jobId?: string; duplicate: boolean }> {
    const rows = await this.request<Array<{ job_id?: unknown; duplicate?: unknown }>>(
      "/rest/v1/rpc/enqueue_indusagi_review_job",
      {
        method: "POST",
        body: JSON.stringify({
          p_delivery_id: request.deliveryId,
          p_event_name: eventName,
          p_installation_id: request.installationId,
          p_repository: request.repository,
          p_owner: request.owner,
          p_repo: request.repo,
          p_pr_number: request.pullNumber,
          p_head_sha: request.headSha,
          p_title: request.title,
        }),
      },
    );
    const row = rows[0];
    if (!row || typeof row.duplicate !== "boolean") throw new Error("Supabase returned no webhook enqueue result");
    if (!row.duplicate && (typeof row.job_id !== "string" || !row.job_id)) {
      throw new Error("Supabase returned no queued review job id");
    }
    return {
      ...(typeof row.job_id === "string" && row.job_id ? { jobId: row.job_id } : {}),
      duplicate: row.duplicate,
    };
  }

  async claim(workerId: string): Promise<ReviewJob | null> {
    const rows = await this.request<Array<Record<string, any>>>("/rest/v1/rpc/claim_indusagi_review_job", {
      method: "POST",
      body: JSON.stringify({ p_worker_id: workerId }),
    });
    return rows[0] ? toJob(rows[0]) : null;
  }

  async setCheckRun(job: ReviewJob, checkRunId: number): Promise<void> {
    await this.ownedPatch(job, { check_run_id: checkRunId });
  }

  async complete(job: ReviewJob, review: ReviewOutput, githubReviewId?: number, commentId?: number): Promise<void> {
    await this.ownedPatch(job, {
      status: "completed",
      review,
      github_review_id: githubReviewId ?? null,
      github_comment_id: commentId ?? null,
      completed_at: new Date().toISOString(),
      worker_id: null,
      claimed_at: null,
      lease_expires_at: null,
      error: null,
    });
  }

  async markCheckRunComplete(jobId: string): Promise<void> {
    await this.patch(jobId, { check_completed_at: new Date().toISOString() });
  }

  async nextCheckRunReconciliation(): Promise<CheckRunReconciliation | null> {
    const path = "/rest/v1/indusagi_review_jobs?status=eq.completed&check_run_id=not.is.null&check_completed_at=is.null&review=not.is.null&select=id,installation_id,owner,repo,check_run_id,review&order=completed_at.asc&limit=1";
    const rows = await this.request<Array<Record<string, any>>>(path);
    const row = rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      installationId: Number(row.installation_id),
      owner: String(row.owner),
      repo: String(row.repo),
      checkRunId: Number(row.check_run_id),
      review: row.review as ReviewOutput,
    };
  }

  async fail(job: ReviewJob, message: string, retryable = true): Promise<void> {
    const retry = retryable && job.attempts < job.maxAttempts;
    const delaySeconds = Math.min(300, Math.max(5, 5 * 2 ** Math.max(0, job.attempts - 1)));
    await this.ownedPatch(job, {
      status: retry ? "pending" : "failed",
      error: message.slice(0, 4_000),
      worker_id: null,
      claimed_at: null,
      lease_expires_at: null,
      ...(retry ? { available_at: new Date(Date.now() + delaySeconds * 1_000).toISOString() } : { completed_at: new Date().toISOString() }),
    });
  }

  async recoverStaleJobs(staleMinutes = 15): Promise<void> {
    await this.request("/rest/v1/rpc/recover_stale_indusagi_review_jobs", {
      method: "POST",
      body: JSON.stringify({ p_stale_minutes: staleMinutes }),
    });
  }

  async renewLease(job: ReviewJob, leaseSeconds = 300): Promise<boolean> {
    const rows = await this.ownedPatch(job, {
      lease_expires_at: new Date(Date.now() + leaseSeconds * 1_000).toISOString(),
    }, false);
    return rows.length > 0;
  }

  private async ownedPatch(job: ReviewJob, values: Record<string, unknown>, required = true): Promise<Array<Record<string, unknown>>> {
    if (!job.workerId || !job.leaseToken) throw new Error("review job has no lease ownership");
    const leaseFloor = encodeURIComponent(new Date().toISOString());
    const filters = `id=eq.${encodeURIComponent(job.id)}&status=eq.running&worker_id=eq.${encodeURIComponent(job.workerId)}&lease_token=eq.${encodeURIComponent(job.leaseToken)}&lease_expires_at=gt.${leaseFloor}`;
    const rows = await this.request<Array<Record<string, unknown>>>(`/rest/v1/indusagi_review_jobs?${filters}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
    });
    if (required && rows.length === 0) throw new Error("review job lease ownership was lost");
    return rows;
  }

  private async patch(jobId: string, values: Record<string, unknown>): Promise<void> {
    await this.request(`/rest/v1/indusagi_review_jobs?id=eq.${encodeURIComponent(jobId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
    });
  }
}
