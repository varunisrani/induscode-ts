// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * structured_output — the per-subagent "final answer channel" tool.
 *
 * A workflow subagent that needs to return a machine-readable result is given a
 * tool named `structured_output` whose `parameters` ARE the caller-supplied
 * TypeBox schema. When the subagent calls it, the framework has already
 * validated the arguments against that schema, so `execute` simply records the
 * validated value into a shared {@link StructuredOutputCapture} and returns a
 * normal {@link AgentToolResult}.
 *
 * Difference from pi's version (pi-dynamic-workflows/src/structured-output.ts):
 * the indus-code-rebuild framework `AgentToolResult` has NO `terminate` flag
 * (see {@link "indusagi/agent"} `AgentToolResult`), so this tool does NOT end
 * the subagent's loop early. The stage-2 runner instead runs the subagent to
 * completion and reads `capture.value` afterward. This file is therefore a
 * plain {@link AgentTool} object literal (no `defineTool`, no `terminate`).
 */
import type { Static, TSchema } from "@sinclair/typebox";
import type { AgentTool } from "../capability-deck";
/**
 * Mutable sink the {@link createStructuredOutputTool} tool writes into. The
 * runner constructs one per subagent run, passes it in, and reads `value` after
 * the subagent finishes.
 */
export interface StructuredOutputCapture<T = unknown> {
    /** The last validated payload the subagent submitted, if any. */
    value: T | undefined;
    /** Whether `structured_output` was ever called during the run. */
    called: boolean;
}
/** Options for {@link createStructuredOutputTool}. */
export interface StructuredOutputToolOptions<TSchemaDef extends TSchema> {
    /** The TypeBox schema the subagent's result must satisfy. */
    schema: TSchemaDef;
    /** The capture sink the validated result is recorded into. */
    capture: StructuredOutputCapture<Static<TSchemaDef>>;
    /** Override the tool name (defaults to `structured_output`). */
    name?: string;
}
/**
 * Build the `structured_output` capture tool for one subagent run.
 *
 * The returned tool's `parameters` are exactly `schema`, so the framework
 * validates the subagent's arguments before `execute` runs; `execute` then
 * records them into `capture` and acknowledges. Idempotent in the sense that a
 * second call simply overwrites `capture.value` with the newer payload.
 *
 * @param options the result schema, the capture sink, and an optional name
 * @returns an {@link AgentTool} whose parameters mirror the caller schema
 */
export declare function createStructuredOutputTool<TSchemaDef extends TSchema>({ schema, capture, name, }: StructuredOutputToolOptions<TSchemaDef>): AgentTool<TSchemaDef, Static<TSchemaDef>>;
