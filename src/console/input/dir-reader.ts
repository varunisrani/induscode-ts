// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Directory reader — the live `fs`-backed implementation of {@link DirReader}.
 *
 * The completion engine ({@link completeAt}) is pure: its path branch lists a
 * directory through an injected {@link DirReader} rather than touching the disk
 * itself, so the suggestion logic stays unit-testable against a synthetic tree.
 * This module is the one place that binds that seam to a real filesystem.
 *
 * {@link createDirReader} returns a reader that resolves a (possibly relative)
 * directory path against a base directory — the session working directory by
 * default — and lists its immediate entries as {@link DirEntry} records. Every
 * failure mode (a missing directory, a permission error, a path that names a
 * file) collapses to an empty list, so the composer never throws while the user
 * is mid-type. A symlink is classified by whether it ultimately resolves to a
 * directory, falling back to its own dirent flag when the target cannot be
 * stat-ed.
 */
import type { DirReader } from "./complete";
/**
 * Build a live {@link DirReader} rooted at `cwd`.
 *
 * The returned reader resolves each requested directory path against `cwd`
 * (an absolute request is used as-is), lists it, and maps each child to a
 * {@link DirEntry}. Any error returns `[]`.
 *
 * @param cwd the base directory relative requests resolve against
 */
export declare function createDirReader(cwd?: string): DirReader;
