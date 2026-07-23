// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget — the condenser factory (the conductor-consumable seam).
 *
 * {@link createCondenser} ties the three pure pieces together into a single
 * function the conductor can drop into its auto-compaction hook:
 *
 *   1. **Gate**   — {@link isOverBudget} asks "is this transcript large enough to
 *      condense?" against the bound model's window and the {@link BudgetPolicy}.
 *   2. **Slice**  — {@link planSlice} splits the transcript into a `dropped` head
 *      (older turns to fold away) and a verbatim `kept` tail, never cutting
 *      between a `toolCall` and its `toolResult`.
 *   3. **Condense** — {@link summarize} turns the dropped head into one synthetic
 *      digest message (scope `"session"`), via the injectable model completer.
 *
 * The returned value is a {@link Condenser} — structurally a conductor
 * `CondenseFn` `(messages) => AgentMessage[] | Promise<AgentMessage[]>`:
 *   - When over budget it returns `[summaryMessage, ...kept]` (a strictly smaller
 *     transcript: one digest in place of the dropped prefix, plus the recent tail).
 *   - Otherwise it returns the input list unchanged (the no-op identity the
 *     conductor expects when nothing needs doing).
 *
 * It is **network-free-testable**: with no `model` bound the gate cannot measure a
 * window, so the condenser is an identity transform; inject a {@link CompleteFn}
 * stub (and a `model`) to drive the summary path with no real API call.
 *
 * Branch-archival is *not* a second engine — {@link condenseScope} forwards to the
 * shared {@link summarize} core pinned to scope `"branch"`. {@link condense} is the
 * matching session-scope entrypoint. Both are re-exported here so callers can
 * summarize a slice directly without building a full {@link Condenser}.
 */
import type { AgentMessage, BudgetPolicy, CondenserDeps, Condenser, Summary } from "./contract.js";
import { condenseScope, type SummarizeDeps } from "./summarize/index.js";
/**
 * The fallback {@link BudgetPolicy} when the caller supplies none. These are
 * ordinary configuration defaults — a window-relative ratio plus a token tail —
 * computed from the model's own context window rather than fixed magic numbers.
 *   - `triggerRatio` 0.75 — condense once ~three-quarters of the window is used.
 *   - `keepRecent`   6000 — keep roughly the last 6k tokens of turns verbatim.
 *   - `reserveTokens` 2048 — carve a little headroom off the window first.
 *
 * Exported as {@link AUTO_CONDENSE_POLICY} so the conductor's token gate and the
 * session runner's slice planner share **one** policy — the value the auto-path
 * trigger ({@link isOverBudget}) compares against must equal the value the slice
 * planner ({@link planSlice}) cuts with, or the gate and the cut disagree.
 */
export declare const AUTO_CONDENSE_POLICY: BudgetPolicy;
/**
 * Build a {@link Condenser} from a {@link CondenserDeps} bundle. The result plugs
 * straight into the conductor's `CondenseFn` seam.
 *
 * Behavior of the returned condenser, given a transcript `messages`:
 *   - If no `model` is bound (so the window is unknown), or the transcript is
 *     **not** over budget, return `messages` **unchanged**.
 *   - Otherwise {@link planSlice} the transcript; if there is nothing to drop
 *     (`cut === 0`) return it unchanged; else {@link summarize} the dropped head
 *     (scope `"session"`) and return `[summary.message, ...plan.kept]`.
 *
 * All dependencies are optional, so `createCondenser()` yields a working,
 * network-free condenser (a no-op until a model and policy are supplied).
 */
export declare function createCondenser(deps?: CondenserDeps): Condenser;
/**
 * Session-scope summarization: fold a slice of dropped messages into one digest
 * for the active session. A thin wrapper over the shared {@link summarize} core
 * pinned to scope `"session"` (the default), so callers don't pass the flag.
 */
export declare function condense(messages: AgentMessage[], deps?: Omit<SummarizeDeps, "scope">): Promise<Summary>;
/**
 * Branch-scope summarization: archive an abandoned branch into one digest. Folds
 * branch-summarization into the same machinery behind the scope flag — re-exported
 * from the summarize subsystem so this module is the single condenser entrypoint.
 */
export { condenseScope };
