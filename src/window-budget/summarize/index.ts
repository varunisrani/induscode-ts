// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget — summarization subsystem barrel.
 *
 * Model-driven condensing of the dropped transcript prefix into one synthetic
 * summary message, with re-authored prompts (new section names + a new tag
 * vocabulary). Branch-archival folds in behind the scope flag — `condenseScope`
 * is the branch entrypoint over the same `summarize` core.
 */
export { buildSummaryPrompt, CONDENSER_BRIEF, flattenTranscript, } from "./prompt.js";
export { condenseScope, summarize } from "./condense.js";
export type { SummarizeDeps } from "./condense.js";
export type { AgentMessage, CompleteFn, CondenseScope, Model, Summary, } from "../contract.js";
