// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Upgrade subsystem — public barrel.
 *
 * Surfaces the ordered, idempotent profile-upgrade registry and its driver.
 * Boot consumers import {@link applyUpgrades} to run pending one-time migrations
 * and the {@link UPGRADES} registry / {@link Upgrade} type for inspection and
 * testing. The marker-file bookkeeping is an internal detail of the driver and
 * is not re-exported.
 */
export type { Upgrade } from "./upgrades";
export { UPGRADES, foldCredentials, reshelveTranscripts, relocateBinaries, renamePromptDir, projectTranscriptDirName, } from "./upgrades";
export type { UpgradeReport } from "./apply";
export { applyUpgrades } from "./apply";
