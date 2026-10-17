import { createSign } from "node:crypto";
import type { PullRequestContext, ReviewOutput } from "./contract.js";

const API = "https://api.github.com";
const USER_AGENT = "indusagi-review-agent/1";

export interface ChangedLines {
  LEFT: Set<number>;
  RIGHT: Set<number>;
}

export function changedLineMap(diff: string): Map<string, ChangedLines> {
  const result = new Map<string, ChangedLines>();
  let current: ChangedLines | undefined;
  let oldLine = 0;
  let newLine = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      const path = match?.[2];
      current = path ? { LEFT: new Set(), RIGHT: new Set() } : undefined;
      if (path && current) result.set(path, current);
      continue;
    }
    const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      continue;
    }
    if (!current || line.startsWith("--- ") || line.startsWith("+++ ")) continue;
    if (line.startsWith("-")) {
      current.LEFT.add(oldLine++);
    } else if (line.startsWith("+")) {
      current.RIGHT.add(newLine++);
    } else if (!line.startsWith("\\ No newline")) {
      oldLine++;
      newLine++;
    }
  }
  return result;
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

export class GitHubAppTokenProvider {
  constructor(
    private readonly appId: string,
    private readonly privateKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private jwt(now = Math.floor(Date.now() / 1000)): string {
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: this.appId }));
    const unsigned = `${header}.${payload}`;
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    return `${unsigned}.${base64url(signer.sign(this.privateKey))}`;
  }

  async installationToken(installationId: number): Promise<string> {
    const response = await this.fetcher(`${API}/app/installations/${installationId}/access_tokens`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.jwt()}`,
        "User-Agent": USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) throw new Error(`GitHub installation token failed (${response.status})`);
    const body = await response.json() as { token?: unknown };
    if (typeof body.token !== "string" || !body.token) throw new Error("GitHub returned no installation token");
    return body.token;
  }
}

export class GitHubClient {
  constructor(
    private readonly token: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly requestTimeoutMs = 30_000,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${this.token}`,
      "User-Agent": USER_AGENT,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers as Record<string, string> | undefined),
    };
    const response = await this.fetcher(`${API}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? AbortSignal.timeout(this.requestTimeoutMs),
    });
    if (!response.ok) {
      const message = (await response.text()).slice(0, 500);
      throw new Error(`GitHub ${init.method ?? "GET"} ${path} failed (${response.status}): ${message}`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    return (contentType.includes("json") ? await response.json() : await response.text()) as T;
  }

  async getPullRequestContext(owner: string, repo: string, pullNumber: number): Promise<PullRequestContext> {
    const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`;
    const pr = await this.request<Record<string, any>>(base);
    const changedFiles = [];
    for (let page = 1; page <= 30; page++) {
      const rows = await this.request<Array<Record<string, any>>>(`${base}/files?per_page=100&page=${page}`);
      changedFiles.push(...rows.map((file) => ({
        filename: String(file.filename),
        status: String(file.status),
        additions: Number(file.additions ?? 0),
        deletions: Number(file.deletions ?? 0),
        ...(typeof file.patch === "string" ? { patch: file.patch } : {}),
      })));
      if (rows.length < 100) break;
    }
    const diff = await this.request<string>(base, { headers: { Accept: "application/vnd.github.v3.diff" } });
    return {
      repository: `${owner}/${repo}`,
      pullNumber,
      headSha: String(pr.head?.sha ?? ""),
      baseSha: String(pr.base?.sha ?? ""),
      title: String(pr.title ?? ""),
      description: String(pr.body ?? ""),
      author: String(pr.user?.login ?? "unknown"),
      additions: Number(pr.additions ?? 0),
      deletions: Number(pr.deletions ?? 0),
      changedFiles,
      diff,
    };
  }

  async readFile(owner: string, repo: string, path: string, ref: string): Promise<string> {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const data = await this.request<Record<string, any>>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`);
    if (data.type !== "file" || typeof data.content !== "string") throw new Error(`${path} is not a readable file`);
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  }

  async searchCode(owner: string, repo: string, query: string): Promise<Array<{ path: string; textMatches: string[] }>> {
    const q = encodeURIComponent(`${query} repo:${owner}/${repo}`);
    const data = await this.request<Record<string, any>>(`/search/code?q=${q}&per_page=20`, {
      headers: { Accept: "application/vnd.github.text-match+json" },
    });
    return Array.isArray(data.items) ? data.items.map((item: any) => ({
      path: String(item.path),
      textMatches: Array.isArray(item.text_matches)
        ? item.text_matches.map((match: any) => String(match.fragment ?? "")).filter(Boolean)
        : [],
    })) : [];
  }

  async postReview(owner: string, repo: string, pullNumber: number, headSha: string, review: ReviewOutput): Promise<number> {
    const marker = `<!-- indusagi-ai-review:${headSha} -->`;
    for (let page = 1; page <= 30; page++) {
      const reviews = await this.request<Array<{ id: number; body?: string }>>(
        `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews?per_page=100&page=${page}`,
      );
      if (Array.isArray(reviews)) {
        const existing = reviews.find((item) => item.body?.includes(marker));
        if (existing) return existing.id;
        if (reviews.length < 100) break;
      } else {
        break;
      }
    }
    const body = `${marker}\n${formatReviewMarkdown(review)}`;
    const response = await this.request<{ id: number }>(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commit_id: headSha,
        event: "COMMENT",
        body,
        comments: review.findings.map((finding) => ({
          path: finding.path,
          line: finding.line,
          side: finding.side,
          body: `**${finding.severity.toUpperCase()} · ${finding.title}**\n\n${finding.body}${finding.suggestion ? `\n\n\`\`\`suggestion\n${finding.suggestion}\n\`\`\`` : ""}`,
        })),
      }),
    });
    return response.id;
  }

  async postStickyComment(owner: string, repo: string, pullNumber: number, review: ReviewOutput): Promise<number> {
    const marker = "<!-- indusagi-ai-review -->";
    const body = `${marker}\n## 🤖 Indusagi AI Review\n\n${formatReviewMarkdown(review)}`;
    const comments = await this.request<Array<{ id: number; body?: string }>>(`/repos/${owner}/${repo}/issues/${pullNumber}/comments?per_page=100`);
    const existing = comments.find((comment) => comment.body?.includes(marker));
    if (existing) {
      await this.request(`/repos/${owner}/${repo}/issues/comments/${existing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
      });
      return existing.id;
    }
    const created = await this.request<{ id: number }>(`/repos/${owner}/${repo}/issues/${pullNumber}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
    });
    return created.id;
  }

  async createCheckRun(owner: string, repo: string, headSha: string, name = "Indusagi Code Review", externalId?: string): Promise<number> {
    if (externalId) {
      const existing = await this.request<{ check_runs?: Array<{ id: number; external_id?: string }> }>(
        `/repos/${owner}/${repo}/commits/${encodeURIComponent(headSha)}/check-runs?check_name=${encodeURIComponent(name)}&per_page=100`,
      );
      const match = existing.check_runs?.find((check) => check.external_id === externalId);
      if (match) return match.id;
    }
    const created = await this.request<{ id: number }>(`/repos/${owner}/${repo}/check-runs`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, head_sha: headSha, status: "in_progress", ...(externalId ? { external_id: externalId } : {}) }),
    });
    return created.id;
  }

  async completeCheckRun(owner: string, repo: string, checkRunId: number, review: ReviewOutput, conclusion: "success" | "neutral" | "failure" = "success"): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/check-runs/${checkRunId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed", conclusion,
        output: { title: `Indusagi review: ${review.risk} risk`, summary: review.summary, text: formatReviewMarkdown(review) },
      }),
    });
  }
}

export function formatReviewMarkdown(review: ReviewOutput): string {
  const findings = review.findings.length
    ? review.findings.map((finding) => `- **${finding.severity.toUpperCase()} · ${finding.title}** — \`${finding.path}:${finding.line}\`\n  ${finding.body}`).join("\n")
    : "No blocking issues found.";
  const tests = review.testPlan.map((step) => `- [ ] ${step}`).join("\n") || "- [ ] Run the existing test suite";
  return `### Summary\n${review.summary}\n\n### Findings\n${findings}\n\n### Risk assessment\n**${review.risk.toUpperCase()}**\n\n### Test plan\n${tests}`;
}
