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
export type { ParsedWorkflow, WorkflowMeta, WorkflowMetaPhase, } from "./parse.js";
export { NONDETERMINISM_ERROR, parseWorkflowScript } from "./parse.js";
export type { StructuredOutputCapture, StructuredOutputToolOptions, } from "./structured-output.js";
export { createStructuredOutputTool } from "./structured-output.js";
export type { WorkflowAgentSnapshot, WorkflowAgentStatus, WorkflowDisplayOptions, WorkflowSnapshot, } from "./display.js";
export { createWorkflowSnapshot, preview, recomputeWorkflowSnapshot, renderWorkflowLines, renderWorkflowText, } from "./display.js";
export type { AgentOptions, WorkflowAgentActivity, WorkflowAgentRunner, WorkflowAgentRunOptions, WorkflowRunOptions, WorkflowRunResult, } from "./engine.js";
export { runWorkflow } from "./engine.js";
export type { WorkflowAgentRunnerOptions, WorkflowSubAgent, WorkflowSpawnContext, } from "./agent-runner.js";
export { createWorkflowAgentRunner } from "./agent-runner.js";
