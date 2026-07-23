// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Completion source — structured suggestions for the composer's prompt line.
 *
 * As the user types, the composer can offer two kinds of completion:
 *
 *   1. **Slash commands** — when the buffer begins with `/`, the leading token is
 *      matched (prefix, case-insensitive) against the {@link SlashRegistry}, and
 *      every command whose name or alias starts with the typed stem is offered.
 *   2. **File paths** — when the active token begins with `@` (an attachment
 *      reference) or looks like a path stem, the trailing path component is
 *      completed against a directory listing.
 *
 * Both branches resolve to the same {@link Suggestion} shape so the surface's
 * completion window renders and applies them uniformly. The whole module is
 * pure: the slash branch reads the registry (plain data), and the path branch
 * takes an injected {@link DirReader} rather than calling `fs` itself, so the
 * suggestion logic is unit-tested with a synthetic filesystem and no I/O.
 *
 * The entry point is {@link completeAt}: given the buffer, the caret offset, and
 * the registry + dir-reader sources, it returns a {@link CompletionResult} —
 * the active token's span (so the surface knows what to replace), the suggestion
 * list, and the completion `kind`. {@link applySuggestion} then splices a chosen
 * suggestion back into the buffer, returning the new buffer and caret.
 */
import type { SlashRegistry } from "../contract";
/** Which source produced a batch of suggestions. */
export type CompletionKind = "slash" | "path" | "none";
/**
 * One structured completion candidate.
 *
 * `value` is the text the surface splices in when this suggestion is accepted
 * (already including any leading sigil — `/` for a command, `@`/trailing slash
 * for a path). `label` is what the completion window shows; `detail` is the
 * one-line description (a command summary, or a `dir`/`file` hint). `isDir`
 * marks a directory so the surface can keep the window open for further descent.
 */
export interface Suggestion {
    /** The text spliced into the buffer when accepted. */
    readonly value: string;
    /** The primary text shown in the completion window. */
    readonly label: string;
    /** A one-line description shown beside the label. */
    readonly detail: string;
    /** Whether this path suggestion is a directory (false for slash commands). */
    readonly isDir: boolean;
}
/**
 * The half-open `[start, end)` span of the buffer the active token occupies.
 *
 * The surface replaces exactly this span when a suggestion is applied, so the
 * sigil and any preceding text are preserved.
 */
export interface TokenSpan {
    /** Inclusive start offset of the active token. */
    readonly start: number;
    /** Exclusive end offset of the active token. */
    readonly end: number;
}
/**
 * The full result of asking for completion at a caret position.
 *
 * `kind` reports which source answered (`none` when nothing applies), `span` is
 * the token to replace, and `suggestions` is the ranked candidate list (empty
 * when nothing matched).
 */
export interface CompletionResult {
    /** Which source produced the suggestions. */
    readonly kind: CompletionKind;
    /** The buffer span the active token occupies. */
    readonly span: TokenSpan;
    /** The ranked candidate list (possibly empty). */
    readonly suggestions: readonly Suggestion[];
}
/** A pure directory listing: each name is a leaf, flagged dir-or-file. */
export interface DirEntry {
    /** The leaf name (no path separators). */
    readonly name: string;
    /** Whether the entry is a directory. */
    readonly isDir: boolean;
}
/**
 * An injected directory reader so the path branch stays pure and testable.
 *
 * Given a directory path (relative to the working dir), it returns that
 * directory's immediate entries, or an empty list when the path does not exist
 * or cannot be read. The live console binds this to a real `fs.readdir`; tests
 * bind it to a synthetic tree.
 */
export type DirReader = (dirPath: string) => readonly DirEntry[];
/**
 * Compute the completion offering at a caret position.
 *
 * Routes on the active token's stem: a `/` at buffer-start yields slash
 * completion; a `@`/path-like stem yields path completion; anything else yields
 * the inert {@link CompletionKind} `none`. Pure with respect to both sources —
 * the registry is data and the dir-reader is injected — so the entire decision
 * is unit-testable.
 *
 * @param buffer   the composer text
 * @param caret    the caret offset within the buffer
 * @param registry the slash-command registry to match against
 * @param readDir  the directory reader the path branch lists through
 */
export declare function completeAt(buffer: string, caret: number, registry: SlashRegistry, readDir: DirReader): CompletionResult;
/**
 * Splice an accepted suggestion back into the buffer.
 *
 * Pure: replaces the active token's span with the suggestion's `value` and
 * returns the rewritten buffer plus the caret placed at the end of the inserted
 * value. The surface re-runs {@link completeAt} afterward so descending into a
 * directory (whose value ends in `/`) immediately offers the next level.
 *
 * @param buffer     the composer text the completion was computed against
 * @param span       the token span returned by {@link completeAt}
 * @param suggestion the candidate the user accepted
 */
export declare function applySuggestion(buffer: string, span: TokenSpan, suggestion: Suggestion): {
    buffer: string;
    caret: number;
};
