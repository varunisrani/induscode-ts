/**
 * Window-budget — model-driven summarization.
 *
 * {@link summarize} is the single condensing primitive: given the dropped prefix
 * of a transcript and a {@link SummarizeDeps} bundle, it flattens those messages,
 * asks the injectable model completer to write a structured digest, and returns a
 * synthetic {@link Summary} message.
 */
import type { AgentMessage, CompleteFn, CondenseScope, Model, Summary } from "../contract.js";
import { completeSimple } from "indusagi/ai";
import { CONDENSER_BRIEF, buildSummaryPrompt, flattenTranscript } from "./prompt.js";

export interface SummarizeDeps {
  /** Literal user guidance; never interpreted as shell input. */
  readonly instructions?: string;
  /** Injectable completer (default: framework `completeSimple`). */
  readonly complete?: CompleteFn;
  /** The summarization model. When omitted, a deterministic local digest is used. */
  readonly model?: Model<Model<string>["api"]>;
  /** Which kind of condense this is; defaults to `"session"`. */
  readonly scope?: CondenseScope;
  /** An earlier digest to refresh/extend (iterative-refresh / branch carry-in). */
  readonly priorDigest?: string;
  /** Cancellation signal forwarded to the completer. */
  readonly signal?: AbortSignal;
  /** Credential for the summarization model's provider, forwarded to the completer. */
  readonly apiKey?: string;
  /** Optional cap on the digest size, in tokens. */
  readonly maxTokens?: number;
}

const DIGEST_HEADER = "[session digest \u2014 older turns condensed]";
const BRANCH_HEADER = "[branch digest \u2014 archived from a path not taken]";

function toSummaryMessage(digest: string, scope: CondenseScope): AgentMessage {
  const header = scope === "branch" ? BRANCH_HEADER : DIGEST_HEADER;
  return {
    role: "user",
    content: `${header}\n\n${digest}`,
    timestamp: Date.now(),
  };
}

function textOf(message: { content: Array<{ type: string; text?: string }> }): string {
  const parts: string[] = [];
  for (const block of message.content) {
    if (block.type === "text" && block.text && block.text.trim()) parts.push(block.text);
  }
  return parts.join("\n").trim();
}

function localFallbackDigest(messages: AgentMessage[], priorDigest?: string): string {
  const lines: string[] = [
    `# Carryover`,
    `${messages.length} earlier message(s) were elided without a summarization model bound.`,
  ];
  if (priorDigest && priorDigest.trim()) {
    lines.push("", priorDigest.trim());
  }
  return lines.join("\n");
}

/**
 * Summarize a slice of dropped messages into a single synthetic {@link Summary}.
 */
export async function summarize(
  messages: AgentMessage[],
  deps: SummarizeDeps = {},
): Promise<Summary> {
  const scope = deps.scope ?? "session";
  const coveredCount = messages.length;
  if (!deps.model) {
    const digest = localFallbackDigest(messages, deps.priorDigest);
    return { message: toSummaryMessage(digest, scope), coveredCount };
  }
  const prompt = buildSummaryPrompt(messages, scope, deps.priorDigest) +
    (deps.instructions ? `\n\nUser compaction guidance:\n${deps.instructions}` : "");
  const context = {
    systemPrompt: CONDENSER_BRIEF,
    messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
  };
  const options = {
    reasoning: "high",
    ...(deps.maxTokens !== undefined ? { maxTokens: deps.maxTokens } : {}),
    ...(deps.signal ? { signal: deps.signal } : {}),
    ...(deps.apiKey !== undefined ? { apiKey: deps.apiKey } : {}),
  };
  const complete = deps.complete ?? completeSimple;
  const reply = await complete(deps.model, context, options);
  const digest = textOf(reply as { content: Array<{ type: string; text?: string }> });
  const finalDigest = digest || localFallbackDigest(messages, deps.priorDigest);
  return { message: toSummaryMessage(finalDigest, scope), coveredCount };
}

/**
 * Branch-archival entrypoint: condense an abandoned branch into one summary
 * message.
 */
export function condenseScope(
  messages: AgentMessage[],
  deps: Omit<SummarizeDeps, "scope"> = {},
): Promise<Summary> {
  return summarize(messages, { ...deps, scope: "branch" });
}

export { flattenTranscript };