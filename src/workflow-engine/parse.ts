// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Workflow script parser — extract and validate the leading `meta` export,
 * enforce determinism, and hand back the runnable sandbox body.
 *
 * A workflow script is plain JavaScript whose FIRST statement must be
 * `export const meta = { ... }` (an object literal). This module:
 *
 *   1. locates that leading export with a lexer-free, dependency-free scan,
 *   2. evaluates ONLY the `{ ... }` literal in a frozen, empty Node `vm`
 *      sandbox (no globals reachable, so the literal cannot call into
 *      anything), capturing the resulting plain object as {@link WorkflowMeta},
 *   3. validates the meta shape (name/description required, optional
 *      whenToUse/phases),
 *   4. enforces the determinism guard over the WHOLE script source —
 *      `Date.now()`, `Math.random()`, and `new Date()` are rejected so a
 *      workflow always produces the same orchestration plan, and
 *   5. strips the `export const meta = …;` statement so the remaining `body`
 *      runs as an ordinary async function body inside the engine sandbox.
 *
 * This is a dependency-free port of pi's acorn-based `parseWorkflowScript`
 * (pi-dynamic-workflows/src/workflow.ts). It deliberately does NOT pull in
 * `acorn`: the only thing the engine needs to read out of the source is the
 * leading literal, which a sandboxed `Function`/`vm` evaluation of that one
 * expression handles safely, and the determinism guard is a source string-scan
 * over the call/`new` forms pi's AST walk rejected.
 */
/** One declared phase in the upfront `meta.phases` outline. */
export interface WorkflowMetaPhase {
    /** Human title for the phase row. */
    title: string;
    /** Optional one-line elaboration of what the phase does. */
    detail?: string;
    /** Optional model hint the phase prefers (documentation only). */
    model?: string;
}
/** The validated `export const meta = { … }` header of a workflow script. */
export interface WorkflowMeta {
    /** Short snake_case identifier for the workflow. */
    name: string;
    /** Non-empty human description of what the workflow accomplishes. */
    description: string;
    /** Optional guidance on when a model should reach for this workflow. */
    whenToUse?: string;
    /** Optional upfront outline; live progress is still driven by `phase()`. */
    phases?: WorkflowMetaPhase[];
}
/** The result of {@link parseWorkflowScript}: validated meta + runnable body. */
export interface ParsedWorkflow {
    /** The validated workflow header. */
    meta: WorkflowMeta;
    /** The script with the leading `export const meta = …` statement removed. */
    body: string;
}
/** Message raised when a script reaches for a non-deterministic primitive. */
export declare const NONDETERMINISM_ERROR = "Workflow scripts must be deterministic: Date.now()/Math.random()/new Date() are unavailable";
/**
 * Parse a workflow script into its validated {@link WorkflowMeta} and the
 * runnable `body` (the script with the meta export removed).
 *
 * @param script the raw workflow JavaScript source
 * @throws if the first statement is not `export const meta = {literal}`, if the
 *   meta fails validation, or if the source uses a non-deterministic primitive
 */
export declare function parseWorkflowScript(script: string): ParsedWorkflow;
