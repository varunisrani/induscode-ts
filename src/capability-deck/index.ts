// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Capability-deck subsystem — public barrel.
 *
 * Re-exports the FROZEN tooling-layer contract: the {@link Capability} alias
 * over the framework `AgentTool`, the branded {@link CapabilityId}, the
 * catalog row ({@link CapabilityCard}) that is the deck's single source of
 * truth, the {@link DeckProfile} table and {@link DeckContext} injection bag,
 * the event-sourced MCP enrollment model ({@link BridgeEntry}, {@link BridgeOp},
 * {@link LedgerSnapshot} + the pure {@link reduceLedger} fold), the assembled
 * {@link ToolDeck} the conductor consumes, and the typed {@link DeckFault}.
 *
 * Behavior modules (the manifest catalog, the builtin bridge, the per-concern
 * provisioners, the bridge network, and the deck assembler) are added to this
 * barrel as they land; consumers import the deck surface from
 * `src/capability-deck` rather than reaching into individual modules.
 */
export type { Capability, AnyCapability, CapabilityId, CapabilityCard, CardProfiles, DeckProfile, DeckContext, DeckFsBackend, DeckShellBackend, DeckFrameworkHandles, BridgeKey, BridgeOp, BridgeEntry, LedgerSnapshot, ToolDeck, DeckBox, DeckFaultKind, DeckFault, AgentTool, AgentToolResult, ToolBox, TSchema, Static, } from "./contract.js";
export { capabilityId, bridgeKey, reduceLedger, deckFault, } from "./contract.js";
/**
 * Built-in bridge — the single seam re-exposing the framework's native tools
 * (read/write/edit/ls/grep/find/bash/process/checklist/web) as capabilities.
 */
export { BUILTIN_BRIDGE, BUILTIN_IDS, BUILTIN_PROFILES, builtinDescriptors, buildBuiltin, buildBuiltinsForProfile, type BridgeBuilder, type BuiltinDescriptor, } from "./builtin-bridge.js";
/**
 * Capability catalog — the single `CAPABILITY_CARDS` source of truth plus the
 * lookups/profile filters derived from it.
 */
export { CAPABILITY_CARDS, CAPABILITY_INDEX, CARD_PROFILES, capabilityIds, hasCapability, findCard, cardsForProfile, } from "./manifest.js";
/**
 * App-novel capability cards — the in-house tools the deck builds itself
 * (checklist, background-process proxy, delegate/sub-agent, SaaS connector,
 * working memory) plus their builders, stores, and injection-handle types.
 */
export { APP_NOVEL_CARDS, todoCard, buildTodoCapability, TodoLedger, type TodoItem, type TodoState, type TodoWeight, type TodoParamsType, type TodoDetails, daemonCard, buildDaemonCapability, DaemonTable, type DaemonState, type DaemonParamsType, type DaemonDetails, taskCard, buildTaskCapability, DELEGATE_HANDLE_KEY, type DelegateRunner, type DelegateRequest, type DelegateResult, type TaskParamsType, type TaskDetails, workflowCard, buildWorkflowCapability, WORKFLOW_HANDLE_KEY, type WorkflowParamsType, type WorkflowDetails, saasCard, buildSaasCapability, SAAS_GATEWAY_KEY, type SaasGatewayPort, type RemoteToolSummary, type RemoteExecution, type SaasParamsType, type SaasDetails, memoryCard, buildMemoryCapability, InMemoryStore, MEMORY_HANDLE_KEY, type MemoryStore, type MemoryParamsType, type MemoryDetails, enterPlanModeCard, exitPlanModeCard, buildEnterPlanModeCapability, buildExitPlanModeCapability, PLAN_HANDLE_KEY, planSlug, planFilePath, writePlan, readPlan, PLANS_DIRNAME, type PlanController, type EnterPlanParamsType, type EnterPlanDetails, type ExitPlanParamsType, type ExitPlanDetails, } from "./cards/index";
/**
 * Bridge ledger — event-sourced enrollment of dynamically grafted MCP tools:
 * content-hash / ULID key minting, the immutable {@link BridgeLedger} value with
 * its pure enroll/retire/withdraw transitions and live projections, and the
 * side-effecting mount/adapt/detach network operations.
 */
export { qualifyBridgeName, bridgeContentKey, bridgeUlidKey, emptyBridgeLedger, bridgeLedgerFromLog, enrollBridgeCard, retire, withdrawServer, liveCapabilities, liveCapabilitiesForServer, type BridgeLedger, type EnrollRequest, attachBridgeCapabilities, detachBridge, bridgeBoxToCapabilities, bridgeCapabilityCard, bridgeConfig, type AttachResult, } from "./bridge-ledger/index";
/**
 * Deck provisioning — the single data-driven {@link provisionDeck} assembler over
 * the profile table, plus the profile-to-cards selection it walks.
 */
export { provisionDeck, cardsForDeckProfile, } from "./provision.js";
