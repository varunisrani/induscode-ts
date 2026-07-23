// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Workspace Locator — turns the active {@link Brand} plus the environment into a
 * single, fully-resolved {@link Workspace} record of absolute paths.
 *
 * Replaces a family of free `get<Thing>Path()` getters with one keyed map: every
 * member of {@link Workspace} is described once as a relative location inside the
 * profile directory, and the record is built by folding that map against a
 * resolved profile root. There is no per-path function and no string literal
 * duplicated across the codebase — the layout is data.
 *
 * Resolution is pure: it reads `os.homedir()` and the process env (both
 * overridable for tests), joins against {@link Brand.profileDirName} /
 * {@link Brand.stateDirName}, and never touches the filesystem. The optional
 * {@link ensureDirs} helper is the only function that writes, and it only ever
 * `mkdir`s directories that belong to the resolved workspace.
 */
import type { Brand, Workspace } from "../boot/contract";
/**
 * Inputs that normally come from the OS but may be pinned for testing or
 * embedding. All optional; each defaults to its live process value.
 */
export interface WorkspaceOverrides {
    /** User home directory; defaults to {@link homedir}. */
    readonly home?: string;
    /** Working directory the resolution is anchored to; defaults to `process.cwd()`. */
    readonly cwd?: string;
    /** Environment to read the profile-dir override from; defaults to {@link process.env}. */
    readonly env?: NodeJS.ProcessEnv;
    /** Brand whose directory names drive the layout; defaults to {@link BRAND}. */
    readonly brand?: Brand;
}
/**
 * Build the fully-resolved {@link Workspace} for the active brand and
 * environment.
 *
 * Pure path computation: resolves the profile root, then folds the
 * {@link LAYOUT} map into a frozen record by joining each member's segments onto
 * that root. No filesystem access — call {@link ensureDirs} separately if the
 * directories need to exist.
 */
export declare function createWorkspace(overrides?: WorkspaceOverrides): Workspace;
/**
 * Create every directory the workspace expects, idempotently.
 *
 * Walks the {@link DIRECTORY_KEYS} subset of the resolved {@link Workspace} and
 * `mkdir -p`s each one. Files are never created here — only their containing
 * directories — so callers can write `settings.json` et al. afterwards without
 * a missing-parent error. Returns the same workspace for chaining.
 */
export declare function ensureDirs(workspace: Workspace): Workspace;
