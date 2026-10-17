import type { ReviewOutput } from "./contract.js";
import { GitHubClient } from "./github.js";
import type { IndusagiReviewer } from "./reviewer.js";
import type { CheckRunReconciliation, ReviewJob, SupabaseReviewStore } from "./supabase.js";

interface TokenProvider {
  installationToken(installationId: number): Promise<string>;
}

interface ReviewStorePort {
  claim(workerId: string): Promise<ReviewJob | null>;
  setCheckRun(job: ReviewJob, checkRunId: number): Promise<void>;
  complete(job: ReviewJob, review: ReviewOutput, githubReviewId?: number, commentId?: number): Promise<void>;
  markCheckRunComplete(jobId: string): Promise<void>;
  nextCheckRunReconciliation(): Promise<CheckRunReconciliation | null>;
  fail(job: ReviewJob, message: string, retryable?: boolean): Promise<void>;
  renewLease(job: ReviewJob, leaseSeconds?: number): Promise<boolean>;
}

class StaleReviewJobError extends Error {}
class LostReviewLeaseError extends Error {}

function isLeaseOwnershipError(error: unknown): boolean {
  return error instanceof LostReviewLeaseError ||
    (error instanceof Error && /lease ownership|lease lost/i.test(error.message));
}

interface ReviewerPort {
  review(context: Awaited<ReturnType<GitHubClient["getPullRequestContext"]>>, github: GitHubClient): Promise<ReviewOutput>;
}

export interface ReviewServiceOptions {
  store: ReviewStorePort | SupabaseReviewStore;
  tokenProvider: TokenProvider;
  githubFactory?: (token: string) => GitHubClient;
  reviewer: ReviewerPort | IndusagiReviewer;
  workerId: string;
  leaseHeartbeatMs?: number;
  leaseSeconds?: number;
  logger?: Pick<Console, "info" | "warn" | "error">;
}

export class ReviewService {
  private readonly githubFactory: (token: string) => GitHubClient;
  private readonly logger: Pick<Console, "info" | "warn" | "error">;
  private readonly leaseHeartbeatMs: number;
  private readonly leaseSeconds: number;

  constructor(private readonly options: ReviewServiceOptions) {
    this.githubFactory = options.githubFactory ?? ((token) => new GitHubClient(token));
    this.logger = options.logger ?? console;
    this.leaseHeartbeatMs = options.leaseHeartbeatMs ?? 60_000;
    this.leaseSeconds = options.leaseSeconds ?? 300;
  }

  async runOnce(): Promise<boolean> {
    const job = await this.options.store.claim(this.options.workerId);
    if (!job) return false;
    let leaseLost = false;
    let renewing = false;
    const heartbeat = setInterval(() => {
      if (renewing || leaseLost) return;
      renewing = true;
      void this.options.store.renewLease(job, this.leaseSeconds).then((owned) => {
        if (!owned) leaseLost = true;
      }).catch((error) => {
        this.logger.warn(`[review-agent] lease heartbeat failed for ${job.id}: ${error instanceof Error ? error.message : String(error)}`);
      }).finally(() => { renewing = false; });
    }, this.leaseHeartbeatMs);
    heartbeat.unref?.();
    const assertLease = () => {
      if (leaseLost) throw new LostReviewLeaseError(`review job lease lost: ${job.id}`);
    };
    try {
      await this.process(job, assertLease);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[review-agent] ${job.repository}#${job.pullNumber} failed: ${message}`);
      if (!isLeaseOwnershipError(error)) {
        await this.options.store.fail(job, message, !(error instanceof StaleReviewJobError));
      }
    } finally {
      clearInterval(heartbeat);
    }
    return true;
  }

  async reconcileCheckRunOnce(): Promise<boolean> {
    const pending = await this.options.store.nextCheckRunReconciliation();
    if (!pending) return false;
    const token = await this.options.tokenProvider.installationToken(pending.installationId);
    const github = this.githubFactory(token);
    await github.completeCheckRun(pending.owner, pending.repo, pending.checkRunId, pending.review, "success");
    await this.options.store.markCheckRunComplete(pending.id);
    return true;
  }

  private async process(job: ReviewJob, assertLease: () => void): Promise<void> {
    const token = await this.options.tokenProvider.installationToken(job.installationId);
    const github = this.githubFactory(token);
    let checkRunId = job.checkRunId;
    if (checkRunId === undefined) {
      try {
        assertLease();
        checkRunId = await github.createCheckRun(job.owner, job.repo, job.headSha, `Indusagi Code Review`, job.id);
        await this.options.store.setCheckRun(job, checkRunId);
      } catch (error) {
        if (isLeaseOwnershipError(error)) {
          throw new LostReviewLeaseError(error instanceof Error ? error.message : "review job lease lost");
        }
        this.logger.warn(`[review-agent] could not create check run for ${job.repository}#${job.pullNumber}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    try {
      const context = await github.getPullRequestContext(job.owner, job.repo, job.pullNumber);
      assertLease();
      if (context.headSha !== job.headSha) {
        throw new StaleReviewJobError(`stale review job: expected head ${job.headSha}, current head is ${context.headSha}`);
      }

      const review = await this.options.reviewer.review(context, github);
      assertLease();
      let githubReviewId: number | undefined;
      let commentId: number | undefined;
      try {
        githubReviewId = await github.postReview(job.owner, job.repo, job.pullNumber, job.headSha, review);
      } catch (error) {
        this.logger.warn(`[review-agent] formal review rejected; using sticky comment: ${error instanceof Error ? error.message : String(error)}`);
        commentId = await github.postStickyComment(job.owner, job.repo, job.pullNumber, review);
      }

      assertLease();
      await this.options.store.complete(job, review, githubReviewId, commentId);
      if (checkRunId !== undefined) {
        try {
          await github.completeCheckRun(job.owner, job.repo, checkRunId, review, "success");
          await this.options.store.markCheckRunComplete(job.id);
        } catch (error) {
          this.logger.warn(`[review-agent] could not complete check run ${checkRunId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      this.logger.info(`[review-agent] completed ${job.repository}#${job.pullNumber} at ${job.headSha}`);
    } catch (error) {
      if (isLeaseOwnershipError(error)) {
        throw new LostReviewLeaseError(error instanceof Error ? error.message : "review job lease lost");
      }
      if (checkRunId !== undefined) {
        const message = error instanceof Error ? error.message : String(error);
        const failureReview: ReviewOutput = {
          summary: message.slice(0, 1_000),
          risk: "high",
          findings: [],
          testPlan: [],
        };
        try {
          await github.completeCheckRun(job.owner, job.repo, checkRunId, failureReview, "failure");
        } catch (checkError) {
          this.logger.warn(`[review-agent] could not fail check run ${checkRunId}: ${checkError instanceof Error ? checkError.message : String(checkError)}`);
        }
      }
      throw error;
    }
  }
}
