// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget — public barrel.
 *
 * The context-window budgeting subsystem: token measurement, slice planning,
 * and transcript condensing (with branch-archival collapsed in behind a scope
 * flag). Re-exports the frozen contract types plus the live functions: the
 * budget math (estimateTokens / isOverBudget / planSlice), the summarization core
 * (summarize / condenseScope), and the conductor-consumable condenser factory
 * (createCondenser / condense).
 */
export type { AgentMessage, BudgetPolicy, CompleteFn, CondensePlan, Condenser, CondenserDeps, CondenseScope, Model, Summary, TokenEstimate, Usage, } from "./contract.js";
export { budgetLimit, estimateMessageTokens, estimateTokens, isOverBudget, planSlice, prefixTokens, } from "./budget/index.js";
export { buildSummaryPrompt, CONDENSER_BRIEF, flattenTranscript, summarize, } from "./summarize/index.js";
export type { SummarizeDeps } from "./summarize/index.js";
export { AUTO_CONDENSE_POLICY, condense, condenseScope, createCondenser } from "./condenser.js";
export { CLEARED_TOOL_RESULT, clearStaleToolResults, COMPACTABLE_TOOL_NAMES, } from "./microcompact.js";
export { rehydrateRecentReads, RESTORED_FILE_PREFIX } from "./rehydrate.js";
