// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * workflow-engine — the pure, network-free orchestration core for the `workflow`
 * dynamic-workflow tool.
 *
 * This barrel exposes the engine subsystem only: the deterministic script
 * parser, the `structured_output` capture tool, the progress snapshot model +
 * text renderer, and the `runWorkflow` engine with its injectable
 * {@link WorkflowAgentRunner} spawn seam. The card and console wiring (the real
 * runner backed by a fresh framework `Agent`, the `tool_update` product signal,
 * and `APP_NOVEL_CARDS` registration) live in stage 2 and consume these exports.
 */
export type { ParsedWorkflow, WorkflowMeta, WorkflowMetaPhase, } from "./parse";
export { NONDETERMINISM_ERROR, parseWorkflowScript } from "./parse";
export type { StructuredOutputCapture, StructuredOutputToolOptions, } from "./structured-output";
export { createStructuredOutputTool } from "./structured-output";
export type { WorkflowAgentSnapshot, WorkflowAgentStatus, WorkflowDisplayOptions, WorkflowSnapshot, } from "./display";
export { createWorkflowSnapshot, preview, recomputeWorkflowSnapshot, renderWorkflowLines, renderWorkflowText, } from "./display";
export type { AgentOptions, WorkflowAgentActivity, WorkflowAgentRunner, WorkflowAgentRunOptions, WorkflowRunOptions, WorkflowRunResult, } from "./engine";
export { runWorkflow } from "./engine";
export type { WorkflowAgentRunnerOptions, WorkflowSubAgent, WorkflowSpawnContext, } from "./agent-runner";
export { createWorkflowAgentRunner } from "./agent-runner";
