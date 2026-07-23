// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Project-context document loader — gathers repository convention files
 * (CLAUDE.md / AGENTS.md and brand variants) into {@link ContextDoc}s that the
 * briefing's `PROJECT_CONTEXT_SECTION` inlines under `# Project context`.
 *
 * The walk runs the ancestor chain from the filesystem root down to the cwd, so
 * the cwd's own files land LAST in the returned array — and since the renderer
 * treats array order as priority order, the closest (most specific) file wins.
 * The home directory is scanned after the chain as a global fallback. Each file
 * may pull additional files inline via `@import` references (bounded to a depth
 * of {@link DEFAULT_MAX_IMPORT_DEPTH} with a per-walk realpath guard so cycles
 * and symlink loops cannot recurse or hang).
 *
 * The whole body is wrapped so that a permissions error on one ancestor, a
 * binary file, or a malformed tree degrades to `[]` rather than crashing boot —
 * repo conventions are a best-effort enrichment, never a hard dependency.
 */
import type { ContextDoc } from "./contract";
/** Options for {@link gatherContextDocs}. Every field is optional. */
export interface GatherContextDocsOptions {
    /** Maximum `@import` recursion depth. Defaults to {@link DEFAULT_MAX_IMPORT_DEPTH}. */
    readonly maxImportDepth?: number;
    /** Maximum bytes retained per document body (post-trim). Defaults to {@link DEFAULT_MAX_BYTES_PER_DOC}. */
    readonly maxBytesPerDoc?: number;
}
/**
 * Gather the repository's project-context documents into an ordered
 * {@link ContextDoc} array for the briefing.
 *
 * Order: the ancestor chain from root → cwd (so cwd's files land last = highest
 * priority), then the home directory as a global fallback. Within each directory
 * the {@link CANDIDATE_FILES} are read in their listed order. Each file may pull
 * `@import` children inline (depth-bounded, cycle-guarded). De-duplication is by
 * realpath, so a file reachable through two roots is inlined once.
 *
 * Never throws: any failure in the walk yields the docs gathered so far (or `[]`).
 */
export declare function gatherContextDocs(cwd: string, home: string, opts?: GatherContextDocsOptions): readonly ContextDoc[];
