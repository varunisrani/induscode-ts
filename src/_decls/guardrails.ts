// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Thin guardrails entry — the headless, library-consumable surface of the
 * indusagi coding agent.
 *
 * This barrel re-exports ONLY the deterministic guardrail primitives (the
 * permission rule engine, the bash blocklist, prompt assembly, deck
 * provisioning, and the read-before-edit / checkpoint stores). It deliberately
 * imports from the LEAF modules — never the root `src/index.ts` barrel — so a
 * consumer can pull in the guardrails without dragging in the Ink/React console
 * tree (`export * as consoleUi from "./console"` lives only on the root barrel).
 *
 * Reachable from a published install as `indusagi-coding-agent/guardrails`.
 */
export { resolveRuleDecision, makeRule, createPermissionGate, READ_ONLY_TOOL_NAMES, EDIT_TOOL_NAMES, } from "./conductor/permissions";
export type { PermissionRule, PermissionMode, PermissionBehavior, PermissionDecision, } from "./conductor/permissions";
export { evaluateCatastrophic, bashSubcommandSubjects } from "./conductor/bash-guard";
export { composeBriefing } from "./briefing/compose";
export { gatherContextDocs } from "./briefing/context-docs";
export type { AgentTool, BriefingContext, ContextDoc } from "./briefing/contract";
export { provisionDeck } from "./capability-deck/provision";
export { createReadStateStore, READ_STATE_HANDLE_KEY, ReadStateStore } from "./boot/runners/read-state";
export { createCheckpointStore, CHECKPOINT_HANDLE_KEY, CheckpointStore } from "./boot/runners/checkpoint";
/**
 * The byte-stable refusal emitted when an edit/write is attempted on a file the
 * agent has not read this session.
 *
 * Surfaced here as the guardrails contract for consumers (e.g. eval fixtures)
 * that assert the refusal verbatim. The literal is intentionally duplicated
 * rather than re-exported because the upstream message lives only as a private
 * module-local const in the framework's read-state gate — it is not part of any
 * public barrel. A reword on either side must update both sites, by design.
 */
export declare const READ_BEFORE_EDIT_MESSAGE = "File has not been read yet. Read it first before writing to it.";
