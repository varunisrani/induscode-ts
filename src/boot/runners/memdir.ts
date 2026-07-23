// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Durable cross-session memory — a disk-backed working-memory store and the
 * project-context document that carries it into each session's system prompt.
 *
 * The `memory` capability ({@link "../../capability-deck/cards/memory-card"})
 * already reads a host-injected store from `ctx.framework[MEMORY_HANDLE_KEY]` and
 * falls back to an in-process buffer when none is wired. This module supplies the
 * missing piece: a synchronous {@link DiskMemoryStore} that persists the agent's
 * note to a per-cwd `MEMORY.md` under the profile directory, so a fact written in
 * one session is still there the next time the agent runs in the same directory.
 *
 * The same file is loaded into the briefing as a {@link ContextDoc} ({@link
 * loadMemoryDoc}) so the model *sees* its prior memory at the top of a fresh
 * session, not only when it explicitly calls the `memory` tool. The body is
 * line-and-byte capped by {@link truncateEntrypointContent} so a runaway memory
 * file cannot bloat the prompt.
 *
 * Design notes:
 *   - The store is STRICTLY SYNCHRONOUS — the {@link MemoryStore} contract the
 *     card validates is sync (`read`/`replace`/`append` return `void`/`string`),
 *     and an async store would silently fail that validation and degrade to the
 *     in-memory fallback.
 *   - The memory directory is scoped UNDER `workspace.profileDir`, NOT the cwd, so
 *     persisting memory never writes files into the user's working tree.
 *   - The cwd is slugged with the SAME regex as {@link "./session".sessionScopeDir}
 *     so the per-cwd partitioning lines up with the session layout.
 *   - Files are written `0o600` (owner-only), matching the auth vault — the memory
 *     note can hold sensitive project facts.
 */
import type { ContextDoc } from "../../briefing";
import { MEMORY_HANDLE_KEY, type MemoryStore } from "../../capability-deck";
import type { Workspace } from "../contract";
/** The on-disk filename the durable memory note is stored under. */
export declare const MEMORY_ENTRYPOINT = "MEMORY.md";
/** Maximum number of lines of the memory note inlined into the prompt. */
export declare const MAX_ENTRYPOINT_LINES = 200;
/**
 * Maximum bytes of the memory note inlined into the prompt.
 *
 * ~125 chars/line at 200 lines: this catches long-line indexes that slip past
 * the line cap (a few very long lines can be far larger than 200 short ones).
 */
export declare const MAX_ENTRYPOINT_BYTES = 25000;
/**
 * Cap the memory note to {@link MAX_ENTRYPOINT_LINES} and
 * {@link MAX_ENTRYPOINT_BYTES}, appending a warning naming which cap fired.
 *
 * Line-truncates first (a natural boundary), then byte-truncates at the last
 * newline before the cap so a line is never cut mid-way. Content within both
 * caps is returned trimmed and unchanged.
 *
 * @param raw the raw memory-file text
 * @returns the prompt-safe body (possibly with a trailing truncation warning)
 */
export declare function truncateEntrypointContent(raw: string): string;
/**
 * The per-cwd memory directory under the profile dir: `<profileDir>/memory/--<slug>--`.
 *
 * The cwd is slugged — every non-alphanumeric run collapsed to a single dash —
 * and wrapped in `--…--` markers, the SAME scheme `sessionScopeDir` uses for the
 * session transcript layout, so the two partitionings line up. The directory
 * lives under `workspace.profileDir`, never inside the repo, so persisted memory
 * never pollutes the user's working tree.
 *
 * @param workspace the resolved on-disk layout (supplies the profile dir)
 * @param cwd       the run's working directory
 */
export declare function memoryDirFor(workspace: Workspace, cwd: string): string;
/**
 * A synchronous, disk-backed {@link MemoryStore} persisting the working-memory
 * note to `<memDir>/MEMORY.md`.
 *
 * Satisfies the `memory` card's narrow three-method port. STRICTLY synchronous:
 * the card validates that each of `read`/`replace`/`append` is a function and
 * calls them inline, so any async variant would break the contract and silently
 * fall back to the in-memory store. Writes create the directory and use mode
 * `0o600` (owner-only), matching the auth vault.
 */
export declare class DiskMemoryStore implements MemoryStore {
    private readonly memDir;
    private readonly file;
    constructor(memDir: string);
    /** The current note, or `""` when no file has been written yet. */
    read(): string;
    /** Overwrite the note, creating the memory directory as needed (mode 0o600). */
    replace(content: string): void;
    /** Add a single line to the end of the note (composed of read + replace). */
    append(line: string): void;
}
/**
 * Load the per-cwd memory note as a {@link ContextDoc} for the briefing's
 * `# Project context` section, or `undefined` when there is nothing to show.
 *
 * An absent file, an empty/whitespace-only note, or any read error yields
 * `undefined` (no project-context block); a non-empty note is capped by
 * {@link truncateEntrypointContent} before inlining. The doc's `path` is the
 * bare `MEMORY.md` label, not the on-disk location, so the heading reads cleanly.
 *
 * @param memDir the per-cwd memory directory from {@link memoryDirFor}
 */
export declare function loadMemoryDoc(memDir: string): ContextDoc | undefined;
/** Re-exported so hosts wiring a store can use one import. */
export { MEMORY_HANDLE_KEY };
