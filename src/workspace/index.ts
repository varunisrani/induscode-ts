// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Workspace subsystem — public barrel.
 *
 * One import site for the keyed Workspace Locator, the concrete {@link BRAND}
 * record, and the runtime/packaging detection. Boot stages depend on this
 * module rather than reaching into the individual files.
 */
export { BRAND, VERSION } from "./brand";
export { createWorkspace, ensureDirs, type WorkspaceOverrides, } from "./locator";
export { isPackagedBinary, resolvePackageRoot, detectPackagingFromModuleUrl, type Packaging, } from "./runtime-detect";
export type { Brand, Workspace } from "../boot/contract";
