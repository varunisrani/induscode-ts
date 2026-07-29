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
export type { Brand, Workspace, Invocation, RunnerId, BootContext, Stage, Runner, StartupResources, CredentialGraph, ThinkingLevel, } from "./contract.js";
export { boot } from "./boot.js";
export { runStages, STAGES, locateWorkspace, upgrade, buildInvocation, resolveResources, selectRunnerStage, } from "./stages.js";
export { tokenizeInvocation, wantsHelp, wantsVersion, } from "./invocation.js";
export { replRunner, oneshotRunner, linkRunner, RUNNERS, selectRunner } from "./runners/registry.js";
export { createAuthVault } from "./auth-vault.js";
export { ensureHeapHeadroom } from "./heap.js";
export { serverMode } from "./runners/server-mode.js";
export { delegateRunner } from "./runners/delegate-runner.js";
export { buildOverlayServices, applyResume } from "./runners/repl-runner.js";
export { buildAddonHost, wrapToolsWithAddons, concatAddonTools } from "./runners/addon-wiring.js";
export { memoryDirFor, DiskMemoryStore } from "./runners/memdir.js";
export type { Upgrade, UpgradeReport } from "./upgrade/index.js";
export { applyUpgrades, UPGRADES } from "./upgrade/index.js";
export { BRAND, VERSION } from "../workspace/brand.js";
export { createWorkspace, ensureDirs } from "../workspace/locator.js";
export type { WorkspaceOverrides } from "../workspace/locator.js";
