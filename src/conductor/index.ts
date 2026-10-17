// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Conductor subsystem — public barrel.
 *
 * Re-exports the FROZEN Phase-2 contract: the product-level signal stream
 * ({@link SessionSignal}), the typed fault model ({@link ConductorFault} +
 * {@link conductorFault}), the on-disk transcript schema ({@link TranscriptEntry},
 * {@link SessionHead}, {@link TRANSCRIPT_SCHEMA}), the model catalog/matcher
 * reference types ({@link ModelCardRef}, {@link MatchQuery}), the immutable
 * state snapshot ({@link ConductorState}), and the {@link SessionConductor}
 * interface plus its {@link SessionConductorOptions}.
 *
 * Behavior modules (signal hub, transcript store, model catalog/matcher,
 * conductor factory, the conductor itself) are added to this barrel as they
 * land; consumers import the conductor surface from `src/conductor` rather than
 * reaching into individual modules.
 */
export type { FaultKind, ConductorFault, SessionSignal, SignalKind, SignalOf, SignalHandler, TranscriptSchema, TranscriptRole, TranscriptEntry, SessionHead, ModelCardRef, MatchQuery, ConductorPhase, ConductorState, QueueMode, QueuedInput, SessionStats, ExecuteBashOptions, BashOutcome, SessionConductor, SessionConductorOptions, CondenseOutcome, AgentMessage, AgentTool, CanUseToolFn, ThinkingLevel, CodingAgentThinkingLevel, Model, Usage, KnownProvider, PermissionMode, } from "./contract.js";
export { conductorFault, TRANSCRIPT_SCHEMA } from "./contract.js";
export { createSessionConductor, reduceState, noopCondense, withGatewayBaseUrl, type AgentLike, type ConductorDeps, type CondenseFn, type RetryPolicy, } from "./conductor.js";
export { SignalHub, translateAgentEvent, type SignalHubOptions } from "./signal-hub/index.js";
export { ModelCatalog, ModelMatcher, canonicalId, toCardRef, type CatalogCard, type CatalogSource, type ResolveInput, } from "./catalog/index.js";
export { TranscriptStore, memoryBackend, fsBackend, replay, type TranscriptBackend, type TranscriptState, type TranscriptClock, type TranscriptStoreOptions, } from "./transcript-store/index.js";
export { parseSkillInvocation, type SkillInvocation } from "./skill-parse/index.js";
export { resolveRuleDecision, parseRule, makeRule, toolMatchesRule, createPermissionGate, createSubagentPermissionGate, collectReadOnlyToolNames, allowAlwaysRuleStrings, isReadOnlyToolName, isEditToolName, READ_ONLY_TOOL_NAMES, EDIT_TOOL_NAMES, type PermissionBehavior, type PermissionRule, type PermissionDecision, type CanUseToolFn as PermissionCanUseToolFn, type ApprovalChoice, type ApprovalOutcome, type ApprovalResolver, type PermissionGateConfig, type SessionPermissionPolicy, } from "./permissions.js";
export { parseBashCommand, catastrophicReason, isCatastrophicCommand, evaluateCatastrophic, bashSubcommandSubjects, type ParsedCommand, } from "./bash-guard.js";
export { DiagnosticsEngine, createDiagnosticKey, deduplicateAndCap, formatDiagnosticsSummary, getSeveritySymbol, parseTscOutput, parseEslintOutput, runTscDiagnostics, runEslintDiagnostics, hasTsConfig, hasEslintConfig, isTypeScriptOrJs, areDiagnosticsEqual, MAX_PER_FILE, MAX_TOTAL, MAX_SUMMARY_CHARS, type Diagnostic, type DiagnosticFile, type DiagnosticSeverity, type DiagnosticsConfig, type DiagnosticRunner, type DedupOptions, type Position, } from "./diagnostics.js";
export { provisionDeck } from "../capability-deck/provision.js";
export { isPermissionMode } from "../settings/contract.js";
export { RESTORED_FILE_PREFIX } from "../window-budget/rehydrate.js";
export { readClipboardImage } from "../kit/clipboard-image.js";
export { openInExternalEditor } from "../kit/external-editor.js";
