// @ts-nocheck — barrel re-export for guardrails subsystem.
// Preserves the package's public surface: `indusagi-coding-agent/guardrails`.

// Permission gate
export {
  READ_ONLY_TOOL_NAMES,
  EDIT_TOOL_NAMES,
  makeRule,
  resolveRuleDecision,
  createPermissionGate,
} from "./conductor/permissions.js";

// Catastrophic-command classifier
export { evaluateCatastrophic, bashSubcommandSubjects } from "./conductor/bash-guard.js";

// Briefing
export { composeBriefing } from "./briefing/compose.js";
export { gatherContextDocs } from "./briefing/context-docs.js";

// Stores
export {
  READ_STATE_HANDLE_KEY,
  ReadStateStore,
  createReadStateStore,
} from "./boot/runners/read-state.js";
export {
  CHECKPOINT_HANDLE_KEY,
  CheckpointStore,
  createCheckpointStore,
} from "./boot/runners/checkpoint.js";

// Deck provisioner
export { provisionDeck } from "./capability-deck/provision.js";

// Stable refusal string (preserved verbatim)
export const READ_BEFORE_EDIT_MESSAGE =
  "File has not been read yet. Read it first before writing to it.";