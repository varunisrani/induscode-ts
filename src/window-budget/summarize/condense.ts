// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget — model-driven summarization.
 *
 * {@link summarize} is the single condensing primitive: given the dropped prefix
 * of a transcript and a {@link SummarizeDeps} bundle, it flattens those messages,
 * asks the injectable model completer to write a structured digest, and returns a
 * synthetic {@link Summary} message that stands in for the slice it covers.
 *
 * Both condensing scopes flow through this one function:
 *   - `"session"` — the active-session checkpoint (head condensed, tail kept by
 *     the caller).
 *   - `"branch"`  — an abandoned branch archived into one message.
 * The only difference is the scope flag forwarded into {@link buildSummaryPrompt}
 * (which selects the framing line). {@link condenseScope} is the thin
 * branch-archival entrypoint that pins `scope: "branch"`.
 *
 * The completer is injectable ({@link SummarizeDeps.complete}, default the
 * framework's `completeSimple`) so tests run with no network — pass a stub that
 * returns a canned {@link AssistantMessage}. When no `model` is supplied there is
 * nothing to call, so {@link summarize} degrades to a deterministic local digest
 * rather than guessing a model — keeping it usable in a bare/offline build.
 */
import type { AgentMessage, CompleteFn, CondenseScope, Model, Summary } from "../contract.js";
import { flattenTranscript } from "./prompt.js";
/**
 * What {@link summarize} needs. Every field is optional so the function is
 * network-free-testable: omit `model` for a local fallback digest, or inject a
 * `complete` stub for a scripted model response.
 */
export interface SummarizeDeps {
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
    /**
     * Credential for the summarization model's provider, forwarded to the
     * completer. Required in practice for sessions whose key is resolved
     * per-call (server tier) rather than from an environment variable.
     */
    readonly apiKey?: string;
    /**
     * Optional cap on the digest size, in tokens, forwarded to the completer's
     * `maxTokens`. A modest ceiling keeps the summary itself from eating the
     * window. When omitted the model's own default applies.
     */
    readonly maxTokens?: number;
}
/**
 * Summarize a slice of dropped messages into a single synthetic {@link Summary}.
 *
 * One code path for both scopes — `deps.scope` (default `"session"`) only changes
 * the prompt framing. With a `model` bound it calls `deps.complete`
 * (default `completeSimple`) once with {@link CONDENSER_BRIEF} as the system
 * prompt and {@link buildSummaryPrompt} as the user turn; otherwise it returns a
 * deterministic local digest. Never throws on an empty model reply — it falls
 * back to the local digest so a {@link Summary} is always produced.
 *
 * @returns a {@link Summary} whose `message` replaces the `coveredCount` source
 *          messages it summarizes.
 */
export declare function summarize(messages: AgentMessage[], deps?: SummarizeDeps): Promise<Summary>;
/**
 * Branch-archival entrypoint: condense an abandoned branch into one summary
 * message. A thin wrapper that pins `scope: "branch"` and delegates to
 * {@link summarize} — the branch case is the same machinery, not a separate
 * engine.
 */
export declare function condenseScope(messages: AgentMessage[], deps?: Omit<SummarizeDeps, "scope">): Promise<Summary>;
/** Re-export the flattener so callers can preview what the model will receive. */
export { flattenTranscript };
