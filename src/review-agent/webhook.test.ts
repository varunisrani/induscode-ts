import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parsePullRequestWebhook, verifyGithubSignature } from "./webhook.js";

const secret = "webhook-secret";
const payload = JSON.stringify({
  action: "opened",
  installation: { id: 77 },
  repository: { full_name: "acme/widgets" },
  number: 12,
  pull_request: {
    draft: false,
    title: "Improve sessions",
    head: { sha: "head123" },
  },
});

function signature(body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("GitHub webhook", () => {
  it("verifies the sha256 signature", () => {
    expect(verifyGithubSignature(payload, signature(payload), secret)).toBe(true);
    expect(verifyGithubSignature(`${payload}x`, signature(payload), secret)).toBe(false);
    expect(verifyGithubSignature(payload, null, secret)).toBe(false);
  });

  it("normalizes a supported non-draft pull request event", () => {
    expect(parsePullRequestWebhook(payload, "delivery-1")).toEqual({
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
    });
  });

  it("ignores draft and unsupported pull request events", () => {
    const draft = JSON.stringify({ ...JSON.parse(payload), pull_request: { ...JSON.parse(payload).pull_request, draft: true } });
    const closed = JSON.stringify({ ...JSON.parse(payload), action: "closed" });
    expect(parsePullRequestWebhook(draft, "delivery-2")).toBeNull();
    expect(parsePullRequestWebhook(closed, "delivery-3")).toBeNull();
  });

  it("accepts repository webhooks without an installation in static-token mode", () => {
    const repositoryPayload = JSON.stringify({
      action: "opened",
      repository: { full_name: "acme/widgets" },
      number: 12,
      pull_request: { number: 12, draft: false, title: "Improve sessions", head: { sha: "abc123" } },
    });

    expect(parsePullRequestWebhook(repositoryPayload, "delivery-4", { allowMissingInstallation: true })?.installationId).toBe(0);
  });
});
