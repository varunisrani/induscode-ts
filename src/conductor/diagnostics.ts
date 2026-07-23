// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Post-edit live diagnostics — an LSP-free, shell-sourced baseline-diff engine.
 *
 * The full induscode story runs a long-lived LSP and pulls structured
 * diagnostics off the language server. That stack is out of scope for the
 * clean-room product, so this is the **pragmatic shell path**: after a turn that
 * edited TypeScript/JS files, the conductor asks this engine to run a project
 * checker (`tsc --noEmit`, plus `eslint --format json` when an eslint config is
 * present), scoped to the workspace, and diff the result against a *per-session
 * baseline* captured before the edits. Only the diagnostics that are genuinely
 * **new** (not in the baseline, not already delivered in a prior turn) are
 * surfaced, and they are injected into the NEXT agent turn as a follow-up note.
 *
 * Everything here is best-effort and non-fatal:
 *   - the checker spawns its OWN child process (lazy `node:child_process`), so
 *     the module stays importable in a non-Node test context;
 *   - a missing/slow/erroring checker NEVER faults the turn — the run is bounded
 *     by an {@link AbortController} timeout and every failure resolves to `[]`;
 *   - results are deduplicated and volume-capped (10/file, 30 total,
 *     severity-sorted) so a broken project can't dump hundreds of lines into
 *     context;
 *   - it is fully opt-out-able (`DiagnosticsConfig.enabled === false`) and
 *     defaults OFF when the workspace has no `tsconfig.json`.
 *
 * The line/column convention mirrors the LSP `Diagnostic.range`: 0-based.
 * `tsc` reports 1-based positions, so {@link runTscDiagnostics} subtracts 1 and
 * {@link formatDiagnosticsSummary} re-adds 1 when rendering for a human/agent.
 */
/** Severity rank, ordered most→least urgent for the volume cap's sort. */
export type DiagnosticSeverity = "Error" | "Warning" | "Info" | "Hint";
/** A zero-based line/column position. */
export interface Position {
    readonly line: number;
    readonly character: number;
}
/** A single diagnostic, shaped after the LSP `Diagnostic` (0-based range). */
export interface Diagnostic {
    readonly message: string;
    readonly severity: DiagnosticSeverity;
    readonly range: {
        readonly start: Position;
        readonly end: Position;
    };
    readonly source?: string;
    readonly code?: string | number;
}
/** All diagnostics for one file, keyed by an absolute fs path used as the uri. */
export interface DiagnosticFile {
    readonly uri: string;
    readonly diagnostics: Diagnostic[];
}
/** Max diagnostics surfaced for any single file (mirrors the LSP registry cap). */
export declare const MAX_PER_FILE = 10;
/** Max diagnostics surfaced across all files in one turn. */
export declare const MAX_TOTAL = 30;
/** Char budget for the rendered summary (truncated past this). */
export declare const MAX_SUMMARY_CHARS = 4000;
/**
 * A stable identity for one diagnostic: position + code + (trimmed) message.
 * Two diagnostics with the same key are "the same problem" for dedup/baseline
 * purposes even across separate checker runs.
 */
export declare function createDiagnosticKey(d: Diagnostic): string;
/** Structural equality over a diagnostic's salient fields (via the dedup key). */
export declare function areDiagnosticsEqual(a: Diagnostic, b: Diagnostic): boolean;
/** Options for {@link deduplicateAndCap}. */
export interface DedupOptions {
    readonly maxPerFile?: number;
    readonly maxTotal?: number;
}
/**
 * Filter, deduplicate, severity-sort, and volume-cap a batch of diagnostic
 * files against a cross-turn `delivered` ledger.
 *
 *   - drops any diagnostic whose key is already in `delivered[uri]` (already
 *     surfaced in a prior turn — don't nag);
 *   - dedups within a file (identical keys collapse to one);
 *   - sorts each file's diagnostics by severity then position;
 *   - caps to `maxPerFile` per file and `maxTotal` overall (errors win the cap);
 *   - records every diagnostic it RETURNS into `delivered` (FIFO-capped per uri)
 *     so the next turn won't re-surface it.
 *
 * `delivered` is mutated in place. Files that end up empty are dropped.
 */
export declare function deduplicateAndCap(files: readonly DiagnosticFile[], delivered: Map<string, Set<string>>, opts?: DedupOptions): DiagnosticFile[];
/** Inline ASCII severity marker (no `figures` dep). */
export declare function getSeveritySymbol(severity: DiagnosticSeverity): string;
/**
 * Render a deduped/capped batch into a compact, agent-readable block. Positions
 * are re-converted to 1-based for display (the engine carries 0-based). The
 * output is truncated to `maxChars` so it can never blow up a context window.
 */
export declare function formatDiagnosticsSummary(files: readonly DiagnosticFile[], maxChars?: number): string;
/** A diagnostics source: produces files for the workspace, honoring `signal`. */
export type DiagnosticRunner = (cwd: string, signal?: AbortSignal) => Promise<DiagnosticFile[]>;
/**
 * Run a project `tsc --noEmit --pretty false` and parse the flat diagnostic
 * lines. Resolves to `[]` on ANY failure (binary missing, abort, non-Node).
 * The local `node_modules/.bin/tsc` is preferred over a global/`npx` install to
 * avoid a version mismatch with the project's own config.
 *
 * tsc lines look like: `src/x.ts(12,5): error TS2322: Type 'a' ...`
 * Positions are 1-based in tsc; we store them 0-based (subtract 1).
 */
export declare function runTscDiagnostics(cwd: string, signal?: AbortSignal): Promise<DiagnosticFile[]>;
/** Parse the combined stdout/stderr of a `tsc --pretty false` run. */
export declare function parseTscOutput(output: string, cwd: string): DiagnosticFile[];
/**
 * Run a project `eslint --format json` over `files` and parse the result.
 * Resolves to `[]` when eslint is absent, no config is found, or anything else
 * goes wrong. severity 2→Error, 1→Warning. Positions are 1-based; stored 0-based.
 */
export declare function runEslintDiagnostics(files: readonly string[], cwd: string, signal?: AbortSignal): Promise<DiagnosticFile[]>;
/** Parse `eslint --format json` output. Resolves config-not-found to `[]`. */
export declare function parseEslintOutput(output: string, cwd: string): DiagnosticFile[];
/** Configuration for the {@link DiagnosticsEngine}. */
export interface DiagnosticsConfig {
    /** Master switch. When `false` the engine reports nothing (opt-out). */
    readonly enabled?: boolean;
    /** The diagnostic sources to run. Defaults to `[runTscDiagnostics]`. */
    readonly runners?: DiagnosticRunner[];
    /** Per-run timeout in ms before the checker is aborted (default 30000). */
    readonly timeoutMs?: number;
    /** Per-file cap (default {@link MAX_PER_FILE}). */
    readonly maxPerFile?: number;
    /** Total cap (default {@link MAX_TOTAL}). */
    readonly maxTotal?: number;
}
/**
 * The post-edit diagnostics engine: runs checkers, diffs against a per-session
 * baseline, and dedups across turns. Stateful and per-session — one instance
 * lives on the conductor for the life of a session.
 */
export declare class DiagnosticsEngine {
    #private;
    constructor(cwd: string, config?: DiagnosticsConfig);
    /** Whether this engine is active. */
    get enabled(): boolean;
    /** Whether the per-session baseline has already been captured. */
    get hasBaseline(): boolean;
    /**
     * Capture the per-session baseline NOW (before any edits land) by running the
     * checkers once over the current project state. Every diagnostic present is
     * recorded as pre-existing, so a later {@link newDiagnostics} surfaces only the
     * problems the session's own edits introduced. Idempotent: a second call is a
     * no-op once a baseline exists. Best-effort — never throws.
     *
     * Prefer calling this at session start (before the agent can edit anything); if
     * it is never called, {@link newDiagnostics} falls back to seeding the baseline
     * on its first invocation.
     */
    seedBaseline(signal?: AbortSignal): Promise<void>;
    /**
     * Run every checker, restrict the results to `editedPaths`, subtract the
     * per-session baseline, dedup against prior turns, and volume-cap. Returns the
     * NEW diagnostics for the edited files (empty when nothing new). Best-effort:
     * never throws, never blocks beyond the configured timeout.
     *
     * The first invocation seeds the baseline from the current project state and
     * returns `[]` (the pre-existing problems are the baseline, not "new").
     */
    newDiagnostics(editedPaths: readonly string[], signal?: AbortSignal): Promise<DiagnosticFile[]>;
    /**
     * Forget the delivered-key history for one uri so a problem at that file can
     * re-surface (e.g. the agent edited it again). The baseline is left intact.
     */
    clearDeliveredForFile(uri: string): void;
    /** Drop all cross-turn state and the baseline (re-seeds on the next run). */
    reset(): void;
}
/** Whether a path looks like a TypeScript/JS source file (by extension). */
export declare function isTypeScriptOrJs(filePath: string): boolean;
/**
 * Whether the workspace has a `tsconfig.json` at its root — the signal used to
 * default the engine ON. Best-effort + synchronous: a probe failure (or a
 * non-Node context) reports `false` so the engine defaults OFF and stays inert.
 */
export declare function hasTsConfig(cwd: string): boolean;
/**
 * Whether the workspace has an eslint config at its root — the signal used to
 * additionally enable the eslint runner. Best-effort + synchronous.
 */
export declare function hasEslintConfig(cwd: string): boolean;
