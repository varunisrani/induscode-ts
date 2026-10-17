import { createHmac, timingSafeEqual } from "node:crypto";
import type { ReviewRequest } from "./contract.js";

const REVIEW_ACTIONS = new Set(["opened", "reopened", "synchronize", "ready_for_review"]);

export function verifyGithubSignature(
  payload: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

export function parsePullRequestWebhook(
  payload: string,
  deliveryId: string,
  options: { allowMissingInstallation?: boolean } = {},
): ReviewRequest | null {
  let decoded: unknown;
  try {
    decoded = JSON.parse(payload);
  } catch {
    throw new Error("GitHub webhook body is not valid JSON");
  }
  const body = object(decoded);
  const action = typeof body?.action === "string" ? body.action : "";
  if (!REVIEW_ACTIONS.has(action)) return null;

  const installation = object(body?.installation);
  const repository = object(body?.repository);
  const pull = object(body?.pull_request);
  const head = object(pull?.head);
  const fullName = typeof repository?.full_name === "string" ? repository.full_name : "";
  const separator = fullName.indexOf("/");
  const installationId = installation?.id == null && options.allowMissingInstallation
    ? 0
    : Number(installation?.id);
  const pullNumber = Number(body?.number ?? pull?.number);
  const headSha = typeof head?.sha === "string" ? head.sha : "";
  const title = typeof pull?.title === "string" ? pull.title : "";
  const draft = pull?.draft === true;

  if (draft && action !== "ready_for_review") return null;
  if (
    !deliveryId || separator <= 0 || separator === fullName.length - 1 ||
    !Number.isInteger(installationId) || installationId < 0 ||
    (!options.allowMissingInstallation && installationId === 0) ||
    !Number.isInteger(pullNumber) || pullNumber <= 0 ||
    !headSha || !title
  ) {
    throw new Error("GitHub pull_request webhook is missing required fields");
  }

  return {
    deliveryId,
    action,
    installationId,
    repository: fullName,
    owner: fullName.slice(0, separator),
    repo: fullName.slice(separator + 1),
    pullNumber,
    headSha,
    title,
    draft,
  };
}
