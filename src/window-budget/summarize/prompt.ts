// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget — summarization prompt assembly (re-authored).
 *
 * When the transcript crosses budget, the older head is *condensed* into one
 * synthetic message. This module turns the dropped slice of {@link AgentMessage}s
 * into the single text payload handed to the model completer. Two pieces ship
 * here:
 *
 *   1. {@link CONDENSER_BRIEF} — the system-prompt brief that frames the model as
 *      a *recorder*, not a continuation of the chat: read the transcript as data
 *      and emit only the structured digest.
 *   2. {@link buildSummaryPrompt} — flattens the dropped messages into a tagged
 *      block and appends the section template the model fills in.
 *
 * OWN VOCABULARY (an original prompt design):
 *   - Section headings are `# Objective / # Guardrails /
 *     # Status (Shipped / Active / Stuck) / # Rationale / # Plan / # Carryover`.
 *   - The transcript is wrapped in `<scrollback>…</scrollback>` and a prior digest
 *     (the branch-archival / iterative-refresh path) in
 *     `<carried-digest>…</carried-digest>`.
 *   - Per-message lines use `» role:` markers (`» you`, `» agent`,
 *     `» agent.plan`, `» agent.call`, `» tool`).
 *
 * No token math, no model calls, no I/O here — only string assembly. The scope
 * flag selects the framing line (active-session checkpoint vs abandoned-branch
 * archive); everything else is one code path.
 */
import type { AgentMessage, CondenseScope } from "../contract.js";
/**
 * The system-prompt brief for the condenser model. Frames the request as a
 * record-keeping task — the model must NOT answer, continue, or act on the
 * conversation; it only transcribes it into the fixed section layout. Re-authored
 * wording; shares no sentences with the legacy `SUMMARIZATION_SYSTEM_PROMPT`.
 */
export declare const CONDENSER_BRIEF: string;
/**
 * Flatten a list of messages into a single `\n`-joined block of `» role:` lines.
 * Exported so the condenser can reuse it for diagnostics/tests.
 */
export declare function flattenTranscript(messages: AgentMessage[]): string;
/**
 * Build the full summarization prompt for a slice of dropped messages.
 *
 * The result is one string: the scope framing, the flattened transcript wrapped
 * in `<scrollback>`, an optional carried digest wrapped in `<carried-digest>`
 * (the iterative-refresh / branch-archival input), and the section template the
 * model fills in. Pass this as the user turn to the injectable completer; pair it
 * with {@link CONDENSER_BRIEF} as the system prompt.
 *
 * @param messages  the dropped prefix to summarize
 * @param scope     `"session"` (active checkpoint) or `"branch"` (archive)
 * @param priorDigest  an optional earlier digest to refresh/extend, threaded in
 *                      under `<carried-digest>` so the model merges rather than
 *                      re-derives. Omit for a first-pass condense.
 */
export declare function buildSummaryPrompt(messages: AgentMessage[], scope: CondenseScope, priorDigest?: string): string;
