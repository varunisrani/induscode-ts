// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Budget gate — the trigger predicate for the window-budget subsystem.
 *
 * {@link isOverBudget} answers the single question "is the transcript large
 * enough that we should condense before the next turn?" by comparing a token
 * estimate against a window-relative threshold derived from the model's
 * `contextWindow` and the caller-supplied {@link BudgetPolicy}.
 *
 * The threshold is computed as:
 *
 *     limit = (contextWindow - reserveTokens?) * triggerRatio
 *
 * i.e. optional fixed headroom is carved off the window first, then the
 * remaining capacity is scaled by the window-relative trigger ratio. This keeps
 * the trigger free of baked-in token counts — `triggerRatio` lives in `(0, 1]`
 * and `reserveTokens` is an optional config value, never a fingerprint constant.
 */
import type { AgentMessage, BudgetPolicy, Model } from "../contract.js";
import type { Api } from "indusagi/ai";
/**
 * Compute the absolute token limit at which condensing should fire for a given
 * model and policy. Exposed for callers that want the number itself (e.g. to
 * display headroom) rather than just the boolean.
 *
 * `reserveTokens` (when present) is subtracted from the window before the ratio
 * is applied; the result is floored at `0` so a misconfigured reserve larger
 * than the window can never yield a negative limit.
 */
export declare function budgetLimit(model: Model<Api>, policy: BudgetPolicy): number;
/**
 * Decide whether the transcript is over budget for the given model and policy.
 *
 * Uses the heuristic {@link estimateTokens} over the serialized transcript and
 * compares it to {@link budgetLimit}. Returns `true` once the estimate strictly
 * exceeds the limit — the signal the conductor uses to kick off a condense.
 */
export declare function isOverBudget(messages: AgentMessage[], model: Model<Api>, policy: BudgetPolicy): boolean;
