// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget / budget — pure budget math.
 *
 * The arithmetic core of the window-budget subsystem, free of I/O, prompts, and
 * model calls:
 *   - {@link estimateTokens} / {@link estimateMessageTokens} / {@link prefixTokens}
 *     — heuristic token measurement and the forward cumulative-token array.
 *   - {@link isOverBudget} / {@link budgetLimit} — the window-relative trigger.
 *   - {@link planSlice} — forward prefix-sum + binary-search cut planning that
 *     never splits a tool_call from its tool_result.
 */
export { estimateMessageTokens, estimateTokens, prefixTokens } from "./estimate.js";
export { budgetLimit, isOverBudget } from "./gate.js";
export { planSlice } from "./slice.js";
