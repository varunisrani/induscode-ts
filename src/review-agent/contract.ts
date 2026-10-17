export const REVIEW_SEVERITIES = ["critical", "high", "medium", "low", "nit"] as const;
export const REVIEW_RISKS = ["low", "medium", "high"] as const;

export type ReviewSeverity = (typeof REVIEW_SEVERITIES)[number];
export type ReviewRisk = (typeof REVIEW_RISKS)[number];
export type ReviewSide = "LEFT" | "RIGHT";

export interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface PullRequestContext {
  repository: string;
  pullNumber: number;
  headSha: string;
  baseSha?: string;
  title: string;
  description: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: ChangedFile[];
  diff: string;
}

export interface ReviewFinding {
  severity: ReviewSeverity;
  confidence: number;
  title: string;
  path: string;
  line: number;
  side: ReviewSide;
  body: string;
  suggestion?: string;
}

export interface ReviewOutput {
  summary: string;
  risk: ReviewRisk;
  findings: ReviewFinding[];
  testPlan: string[];
}

export interface ReviewRequest {
  deliveryId: string;
  action: string;
  installationId: number;
  repository: string;
  owner: string;
  repo: string;
  pullNumber: number;
  headSha: string;
  title: string;
  draft: boolean;
}
