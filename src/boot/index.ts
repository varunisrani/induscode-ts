// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Boot subsystem — public barrel.
 *
 * Re-exports the frozen Phase-1 contract type surface plus the assembled boot
 * layer: the orchestrator ({@link boot}), the stage pipeline
 * ({@link runStages} / {@link STAGES}), the invocation parser
 * ({@link tokenizeInvocation}), the runner registry ({@link selectRunner} /
 * {@link RUNNERS}), and the upgrade driver ({@link applyUpgrades}). Consumers
 * import the boot type surface and behavior from `src/boot` rather than reaching
 * into individual modules.
 */
export type { Brand, Workspace, Invocation, RunnerId, BootContext, Stage, Runner, StartupResources, CredentialGraph, ThinkingLevel, } from "./contract";
export { boot } from "./boot";
export { runStages, STAGES, locateWorkspace, upgrade, buildInvocation, resolveResources, selectRunnerStage, } from "./stages";
export { tokenizeInvocation, wantsHelp, wantsVersion, } from "./invocation";
export { replRunner, oneshotRunner, linkRunner, RUNNERS, selectRunner, createReadStateStore, READ_STATE_HANDLE_KEY, ReadStateStore, createCheckpointStore, CHECKPOINT_HANDLE_KEY, CheckpointStore, } from "./runners";
export type { Upgrade, UpgradeReport } from "./upgrade";
export { applyUpgrades, UPGRADES } from "./upgrade";
export { BRAND, createWorkspace, ensureDirs } from "../workspace";
export type { WorkspaceOverrides } from "../workspace";
