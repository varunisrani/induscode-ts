// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget contract — the FROZEN type surface of the context-window
 * budgeting subsystem (Phase 3, subsystem 05).
 *
 * A long-running coding session accrues messages — user turns, assistant turns,
 * tool calls and their results — until the transcript approaches the model's
 * context window. This subsystem keeps the session usable by *condensing* older
 * history into a single structured summary message while keeping a verbatim
 * tail of the most-recent turns. It answers three questions:
 *
 *   1. **Budget**  — *when* are we over budget? A {@link BudgetPolicy} carries
 *      config-sourced thresholds (no magic literals); {@link isOverBudget}
 *      decides from a real {@link TokenEstimate}.
 *   2. **Slice**   — *where* do we cut? {@link planSlice} computes a
 *      {@link CondensePlan} via a forward prefix-sum + binary search over a
 *      cumulative-token array, never splitting a tool_call from its tool_result.
 *   3. **Condense** — *how* do we compress the dropped portion? A
 *      {@link Condenser} flattens the dropped messages, asks an injectable model
 *      completer for a structured {@link Summary}, and returns the rebuilt
 *      transcript (summary + kept tail).
 *
 * This file declares *only* shapes plus the function-type seams — no behavior,
 * no I/O, no prompt strings. Every later window-budget module (the meter, the
 * slice planner, the condenser, the branch archivist, the prompt templates, and
 * the public barrel) is written against the names declared here.
 *
 * Design stance:
 *   - Thresholds are **configuration, not constants**. {@link BudgetPolicy}
 *     fields are supplied by the caller; this module bakes in no fixed token
 *     fingerprints. Defaults, if any, live in the implementation and are
 *     computed relative to the model's own context window.
 *   - Branch-summarization is **not a separate engine**. It collapses into the
 *     condenser behind a {@link CondenseScope} flag (`"session" | "branch"`),
 *     so there is one prompt-assembly path, one token estimator, one slicer.
 *   - The model completer is **injectable** ({@link CompleteFn}, default the
 *     framework's `completeSimple`) so the condenser runs in tests with no
 *     network.
 *   - The produced condenser is **conductor-consumable**: a {@link Condenser}
 *     is structurally a conductor `CondenseFn`
 *     (`(messages: AgentMessage[]) => AgentMessage[] | Promise<AgentMessage[]>`),
 *     so a {@link CondenserDeps}-built condenser plugs straight into the
 *     conductor's auto-compaction seam.
 *
 * Framework anchors (all from the `indusagi` package — the sibling rebuilt
 * framework this app targets):
 *   - `AgentMessage`                          ← `indusagi/agent`
 *   - `Model`, `Usage`, `completeSimple` (and its `Api`/`AssistantMessage`/
 *     `Context`/`SimpleStreamOptions`/`StreamLogger` shapes) ← `indusagi/ai`
 *
 * This module never re-declares these; it composes them.
 */
import type { AgentMessage } from "indusagi/agent";
import type { Api, AssistantMessage, Context, Model, SimpleStreamOptions, StreamLogger, Usage } from "indusagi/ai";
/** Re-exported framework vocabulary window-budget consumers routinely need. */
export type { AgentMessage, Model, Usage };
/**
 * The config-sourced thresholds that govern when and how the transcript is
 * condensed. Every field is a *number the caller supplies* — there are no magic
 * token literals baked into this contract. An implementation may
 * provide defaults, but they are configuration values, not protected constants,
 * and deliberately differ from the legacy fingerprints.
 */
export interface BudgetPolicy {
    /**
     * Fraction of the model's `contextWindow` at which condensing is triggered,
     * in `(0, 1]`. The meter is "over budget" once the estimated context tokens
     * cross `contextWindow * triggerRatio`. Expressing the trigger as a ratio
     * (rather than an absolute reserve) keeps it window-relative and free of
     * baked-in token counts.
     */
    readonly triggerRatio: number;
    /**
     * How much of the recent transcript to keep verbatim, measured in estimated
     * tokens. The slice planner preserves a tail of at least this many tokens
     * (snapped to a legal boundary) and condenses everything before it.
     */
    readonly keepRecent: number;
    /**
     * Optional token headroom to subtract from the window before the trigger is
     * evaluated — a safety margin so a condense fires *before* the very next turn
     * would overflow. When omitted, only {@link triggerRatio} governs the trigger.
     */
    readonly reserveTokens?: number;
}
/**
 * The outcome of measuring a transcript against a model's window. Anchors on the
 * provider's authoritative `usage` count when available (`anchored: true`) and
 * falls back to a rough char/role estimate otherwise; either way `contextTokens`
 * is the figure {@link isOverBudget} compares to `contextWindow`.
 */
export interface TokenEstimate {
    /** Best estimate of tokens currently occupying the context window. */
    readonly contextTokens: number;
    /** The model's total context window, in tokens (`Model.contextWindow`). */
    readonly contextWindow: number;
    /**
     * `true` when {@link contextTokens} is anchored on a real provider `usage`
     * figure (only trailing, post-usage messages are estimated); `false` when the
     * whole figure is a heuristic estimate.
     */
    readonly anchored: boolean;
}
/**
 * The pre-computed result of {@link planSlice}: the chosen cut index and the
 * resulting partition of the transcript.
 *
 * The cut is found by a *forward* prefix-sum + binary search: build a cumulative
 * estimated-token array over the messages, binary-search for the boundary index
 * nearest `total - keepRecent`, then nudge to the closest *legal* boundary —
 * never landing between a `toolCall` and its `toolResult`.
 *
 * Invariants:
 *   - `kept.length + dropped.length === messages.length`
 *   - `dropped` is the prefix `messages[0 .. cut)` (the older slice to condense)
 *   - `kept`    is the suffix `messages[cut ..]` (the verbatim recent tail)
 *   - `cut` is `0` when nothing is condensable (everything kept).
 */
export interface CondensePlan {
    /** Index of the legal cut boundary: `dropped = messages.slice(0, cut)`. */
    readonly cut: number;
    /** The verbatim recent tail preserved as-is (`messages.slice(cut)`). */
    readonly kept: AgentMessage[];
    /** The older slice to be folded into a {@link Summary} (`messages.slice(0, cut)`). */
    readonly dropped: AgentMessage[];
}
/**
 * Which kind of condensing run this is — the flag that collapses
 * branch-summarization into the single condenser path:
 *   - `"session"` — condense the *active* transcript in place (the trigger /
 *     overflow path); keeps a recent tail, summarizes the head.
 *   - `"branch"`  — archive an *abandoned* branch into one summary message so its
 *     context isn't lost on tree navigation; no verbatim tail is retained.
 */
export type CondenseScope = "session" | "branch";
/**
 * The structured result of summarizing a slice of dropped messages: a single
 * synthetic {@link AgentMessage} that stands in for the messages it covers.
 */
export interface Summary {
    /** The synthetic summary message to splice into the rebuilt transcript. */
    readonly message: AgentMessage;
    /** How many source messages this summary replaces. */
    readonly coveredCount: number;
}
/**
 * The injectable model-completion function. Structurally identical to the
 * framework's `completeSimple`, so the real `completeSimple` is the drop-in
 * default and a test can pass a no-network stub of the same shape. The
 * condenser uses this single call to turn flattened transcript text into a
 * {@link Summary}.
 */
export type CompleteFn = <TApi extends Api>(model: Model<TApi>, context: Context, options?: SimpleStreamOptions, logger?: StreamLogger) => Promise<AssistantMessage>;
/**
 * A condenser: takes the active branch's messages and returns the rebuilt
 * transcript (condensed head + verbatim tail, or the input unchanged when there
 * is nothing to do).
 *
 * This type is **structurally compatible with the conductor's `CondenseFn`**
 * (`(messages: AgentMessage[]) => AgentMessage[] | Promise<AgentMessage[]>`), so
 * the result of the condenser factory plugs directly into the conductor's
 * auto-compaction seam with no adapter.
 */
export type Condenser = (messages: AgentMessage[]) => AgentMessage[] | Promise<AgentMessage[]>;
/**
 * Dependencies for building a {@link Condenser}. All fields are optional so a
 * bare `createCondenser()` yields a working, network-free-testable condenser:
 *   - `complete` defaults to the framework's `completeSimple`.
 *   - `policy` defaults to the implementation's config-sourced thresholds.
 *   - `model` is the summarization model; when omitted the condenser may fall
 *     back to a no-op (return input unchanged) rather than guess a model.
 */
export interface CondenserDeps {
    /**
     * The injectable model completer (default: framework `completeSimple`). Inject
     * a stub of {@link CompleteFn} shape to run the condenser with no network.
     */
    readonly complete?: CompleteFn;
    /** The model used to write the summary. When omitted, condensing is a no-op. */
    readonly model?: Model<Api>;
    /** The config-sourced budget thresholds (default: implementation defaults). */
    readonly policy?: BudgetPolicy;
}
