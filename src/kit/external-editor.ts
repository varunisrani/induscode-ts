// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * External-editor kit — hand the composer buffer off to the user's `$EDITOR`,
 * wait for them to close it, and read the edited text back.
 *
 * Composing a long prompt at a single-line terminal caret is painful; this
 * helper stages the current buffer in a temp file, launches the configured
 * editor against it with the terminal shared (so vi/nano/etc. take over the
 * screen), blocks until the editor exits, then reads the file back as the new
 * buffer.
 *
 * The editor is resolved from `$VISUAL`, then `$EDITOR`, then a `vi` fallback —
 * the conventional precedence. The spawn is synchronous and inherits stdio so
 * the editor owns the real terminal; on return the temp file is removed. Any
 * failure (no editor that runs, a non-zero exit, an unreadable file) yields
 * `null` and the caller keeps the original buffer.
 *
 * Only `child_process` / `fs` / `os` builtins are used; nothing here depends on
 * the framework or a sibling subsystem.
 */
/** Options for {@link openInExternalEditor} — injectable so tests stay hermetic. */
export interface ExternalEditorOptions {
    /** Override the environment consulted for `$VISUAL` / `$EDITOR`. */
    readonly env?: NodeJS.ProcessEnv;
    /** Override the temp directory the scratch file is written to. */
    readonly dir?: string;
}
/**
 * Stage `buffer` in a temp file, open it in the user's editor sharing this
 * terminal, block until the editor exits, and return the edited text — or
 * `null` when the editor could not run or exited non-zero.
 *
 * A single trailing newline (most editors add one on save) is stripped so the
 * round-trip does not silently grow the buffer. The temp file is always removed.
 */
export declare function openInExternalEditor(buffer: string, options?: ExternalEditorOptions): string | null;
