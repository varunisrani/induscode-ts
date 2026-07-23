// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Workflow capability — orchestrate a deterministic fan-out of subagents.
 *
 * App-novel wiring, sibling to (and UNRELATED to) the {@link "./task-card"}
 * delegate card. The `workflow` tool runs a deterministic JavaScript workflow
 * script that calls `agent()`, `parallel()`, and `pipeline()` to fan work out
 * across many fresh subagents and fan their results back in, all under a live
 * `◆ Workflow:` progress tree streamed into the tool result.
 *
 * The actual subagent runner is NOT owned by this card — it is a framework /
 * boot concern injected through {@link DeckContext.framework} under the
 * {@link WORKFLOW_HANDLE_KEY} key. When that handle is present the capability
 * really runs the workflow (via the pure {@link runWorkflow} engine); when it is
 * absent (tests, headless tooling, a host that has not wired the runner) the
 * capability degrades gracefully to a clearly-typed {@link STUB_NOTE} result
 * rather than throwing, exactly like the task card's `readDelegateRunner` path.
 *
 * Recursion guard: this card is registered all-profile-only in
 * {@link "../cards/index"} (`APP_NOVEL_CARDS`), so the `'authoring'` deck a
 * workflow subagent runs against EXCLUDES it — a subagent cannot call `workflow`.
 *
 * Live UI: each engine lifecycle callback mutates a {@link WorkflowSnapshot} and
 * calls the framework `onUpdate` with the snapshot rendered through
 * {@link renderWorkflowText} (the v1 string renderer). Updates are coalesced to
 * status transitions (phase / agent start / agent end), not every log line, to
 * avoid render thrash. The conductor re-projects the framework
 * `tool_execution_update` event to a `tool_update` product signal (stage 3).
 */
import { type Static } from "@sinclair/typebox";
import type { Capability, CapabilityCard, DeckContext } from "../contract";
import { type WorkflowSnapshot } from "../../workflow-engine";
/** Key under which a host wires a live workflow agent runner into the context. */
export declare const WORKFLOW_HANDLE_KEY: "workflow";
declare const WorkflowParams: import("@sinclair/typebox").TObject<{
    script: import("@sinclair/typebox").TString;
    args: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>;
/** Statically-inferred parameter type the capability's `execute` receives. */
export type WorkflowParamsType = Static<typeof WorkflowParams>;
/** Structured detail returned alongside the model-facing content (the snapshot). */
export type WorkflowDetails = WorkflowSnapshot;
/**
 * Build the workflow capability.
 *
 * If a {@link WorkflowAgentRunner} is present on the context it is bound and the
 * tool truly orchestrates; otherwise the tool builds anyway and returns a typed,
 * non-throwing stub so the deck stays assemblable in every environment.
 *
 * @param ctx the deck context; an optional runner is read from
 *            `ctx.framework[WORKFLOW_HANDLE_KEY]`.
 */
export declare function buildWorkflowCapability(ctx: DeckContext): Capability<typeof WorkflowParams, WorkflowDetails>;
/** Catalog row for the workflow capability. */
export declare const workflowCard: CapabilityCard;
export {};
