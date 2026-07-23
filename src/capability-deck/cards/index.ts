// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Capability cards — the app-novel capabilities the deck builds in-house.
 *
 * Each card is a {@link CapabilityCard}: metadata plus a `build(ctx)` factory
 * that mints a live {@link Capability} (the framework `AgentTool` shape) for a
 * working context. These are written fresh against the framework contract — not
 * derived from any prior tooling layer — and stay framework-agnostic where the
 * behavior is original (todo and bg-process wrap only Node + the deck contract).
 *
 * The connector and memory cards expose a thin, clearly-typed adapter seam over
 * a framework handle injected through {@link DeckContext.framework}; when no
 * handle is wired they degrade to a typed stub so every card builds and runs in
 * any environment, including tests.
 *
 * {@link APP_NOVEL_CARDS} is the contribution this module makes to the catalog;
 * the manifest module composes it with the builtin-bridge cards (the framework's
 * file/shell/search/web tools) to form the single `CAPABILITY_CARDS` source of
 * truth from which the deck's index and profiles are derived.
 */
import type { CapabilityCard } from "../contract";
export { todoCard, buildTodoCapability, TodoLedger, type TodoItem, type TodoState, type TodoWeight, type TodoParamsType, type TodoDetails, } from "./todo-card";
export { daemonCard, buildDaemonCapability, DaemonTable, type DaemonState, type DaemonParamsType, type DaemonDetails, } from "./bg-process-card";
export { taskCard, buildTaskCapability, DELEGATE_HANDLE_KEY, type DelegateRunner, type DelegateRequest, type DelegateResult, type TaskParamsType, type TaskDetails, } from "./task-card";
export { workflowCard, buildWorkflowCapability, WORKFLOW_HANDLE_KEY, type WorkflowParamsType, type WorkflowDetails, } from "./workflow-card";
export { saasCard, buildSaasCapability, SAAS_GATEWAY_KEY, type SaasGatewayPort, type RemoteToolSummary, type RemoteExecution, type SaasParamsType, type SaasDetails, } from "./saas-card";
export { memoryCard, buildMemoryCapability, InMemoryStore, MEMORY_HANDLE_KEY, type MemoryStore, type MemoryParamsType, type MemoryDetails, } from "./memory-card";
export { enterPlanModeCard, exitPlanModeCard, buildEnterPlanModeCapability, buildExitPlanModeCapability, PLAN_HANDLE_KEY, type PlanController, type EnterPlanParamsType, type EnterPlanDetails, type ExitPlanParamsType, type ExitPlanDetails, } from "./plan-tools";
export { planSlug, planFilePath, writePlan, readPlan, PLANS_DIRNAME } from "./plan-file";
/**
 * The app-novel cards, in catalog order. The manifest module concatenates these
 * with the builtin-bridge cards to build the full `CAPABILITY_CARDS` array.
 *
 * The plan-mode tools live here (the broadest `all` profile only): plan mode is a
 * gate over mutating work, so the tools are only meaningful in a full-access deck —
 * never the read-only `authoring` subset.
 */
export declare const APP_NOVEL_CARDS: readonly CapabilityCard[];
