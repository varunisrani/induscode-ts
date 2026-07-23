// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Slice planner — decides *where* to cut the transcript when it is over budget.
 *
 * {@link planSlice} partitions a transcript into a `dropped` prefix (older
 * messages destined for a summary) and a `kept` suffix (the verbatim recent
 * tail), choosing the boundary so the tail holds roughly `policy.keepRecent`
 * tokens. It does this with a FORWARD prefix-sum + BINARY SEARCH (not a backward
 * accumulate-and-snap):
 *
 *   1. Build the cumulative-token array `prefix` (forward, monotonic).
 *   2. The total is `prefix[n]`; we want the tail to be ~`keepRecent` tokens, so
 *      the *ideal* cut sits at the first index `i` whose suffix
 *      `prefix[n] - prefix[i]` has fallen to `<= keepRecent`. Equivalently, the
 *      first `i` with `prefix[i] >= prefix[n] - keepRecent`. That predicate is
 *      monotonic in `i`, so we BINARY-SEARCH the lower bound of the threshold
 *      `prefix[n] - keepRecent` over `prefix`.
 *   3. Snap the resulting index FORWARD to the nearest *legal* boundary so we
 *      never land between a tool_call and its matching tool_result. A boundary
 *      is legal iff the message it lands on is not a `toolResult` (a tool result
 *      always belongs with the assistant turn that issued the call, so the tail
 *      may never begin with one).
 *
 * If the whole transcript already fits within `keepRecent`, or snapping forward
 * consumes everything, the cut is `0` (nothing condensable — keep it all).
 */
import type { AgentMessage, BudgetPolicy, CondensePlan } from "../contract.js";
/**
 * Plan the condense slice for a transcript under a {@link BudgetPolicy}.
 *
 * Chooses the cut via forward prefix-sum + binary search for the boundary that
 * keeps ~`policy.keepRecent` recent tokens, then snaps that boundary forward to
 * a legal point (never between a tool_call and its tool_result).
 *
 * @returns a {@link CondensePlan} with the chosen `cut`, the `kept` tail
 *          (`messages.slice(cut)`) and the `dropped` head (`messages.slice(0, cut)`).
 *          `cut === 0` when nothing is condensable.
 */
export declare function planSlice(messages: AgentMessage[], policy: BudgetPolicy): CondensePlan;
