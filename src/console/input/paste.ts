// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Paste coalescing — collapse a large clipboard burst into one compact marker.
 *
 * A terminal in bracketed-paste mode delivers a multi-line paste to the input
 * hook as a single fat `input` string (or, on terminals without bracketing, as
 * a rapid burst of per-character events). Splicing thousands of characters into
 * the visible composer makes the editor unusable. The console instead replaces
 * a large paste with a short placeholder token — a {@link PasteMarker} — that
 * stands in for the hidden body, then re-expands every marker back to its
 * original text at submit time.
 *
 * This module is the pure machinery behind that:
 *
 *   1. {@link classifyPaste} — decide whether a chunk is "large" (worth hiding)
 *      from its line/char extent, using {@link PASTE_THRESHOLDS}.
 *   2. {@link PasteVault} — an immutable store mapping each marker token to the
 *      text it stands for, minted in submission order.
 *   3. {@link coalescePaste} — fold a large chunk into a vault, returning the
 *      marker token to splice plus the grown vault.
 *   4. {@link expandMarkers} — at submit time, rewrite every marker token in the
 *      buffer back to the stored body.
 *
 * All four are pure functions over plain data — no Ink, no refs, no timers — so
 * the whole paste pipeline is unit-tested in isolation. The component owns only
 * the live vault value and the burst-coalescing timer; the decisions are here.
 *
 * The marker format is the console's own: `[Pasted text #N +K lines]`, where `N` is the
 * 1-based mint order and `K` is the hidden line count. Matches induscode style:
 * visually distinct in the composer, unambiguous to match, and trivial to strip.
 */
/**
 * The size at or above which a pasted chunk is hidden behind a marker.
 *
 * A chunk qualifies if it spans at least {@link lines} newlines *or* at least
 * {@link chars} characters — whichever trips first — so both a tall short paste
 * and a wide single-line paste are caught.
 */
export interface PasteThresholds {
    /** Minimum newline count to treat a chunk as a large paste. */
    readonly lines: number;
    /** Minimum character count to treat a chunk as a large paste. */
    readonly chars: number;
}
/**
 * The default cut-offs above which a paste is coalesced into a marker.
 *
 * Matched to the reference agent: a paste of MORE than 10 lines (i.e. ≥10
 * newlines) or more than 1000 characters hides behind a marker; anything
 * smaller — including the common 8-line snippet — splices inline and renders
 * as visible multi-line text in the composer.
 */
export declare const PASTE_THRESHOLDS: PasteThresholds;
/**
 * The maximum gap, in milliseconds, between per-character events still treated
 * as one burst.
 *
 * On terminals that do not bracket pastes, the hook sees many tiny events in
 * quick succession; the surface accumulates them while consecutive events land
 * within this window, then classifies the assembled chunk once the gap exceeds
 * it. Exposed as data so the coalescing timer and any test share one value.
 */
export declare const PASTE_BURST_GAP_MS = 24;
/**
 * How long, after a coalesced flush, a paste stays "active" — a further
 * multi-character chunk landing within this window APPENDS to the active
 * marker instead of minting a new one.
 *
 * Terminals deliver a big paste as a series of ~1KB stdin reads whose gaps can
 * exceed any reasonable per-chunk debounce, so timing alone shreds one paste
 * into many markers (`[Pasted #11][Pasted #12]…`, issue #18's second form).
 * Sized GENEROUSLY: a very long paste (the spec case is 1000 lines) must
 * survive mid-stream read hiccups as ONE marker, and the failure mode of a
 * too-long window is mild — two lightning-fast deliberate pastes merge into
 * one marker whose expansion is still the correct concatenated text — while a
 * too-short window re-creates the shredding this exists to fix. Two human
 * paste chords are >300ms apart in practice; single characters (real typing)
 * never extend the window.
 */
export declare const PASTE_CONTINUATION_MS = 250;
/**
 * Ceiling on the line count a single marker absorbs via continuation. One
 * user paste stays ONE marker up to this many lines; a paste that keeps
 * streaming past it rolls over into a fresh marker ("one more paste") so a
 * runaway multi-megabyte paste can't grow a single unbounded vault body.
 */
export declare const PASTE_MARKER_LINE_CAP = 1000;
/** The console's own placeholder format for a hidden paste body. */
export declare function pasteMarker(ordinal: number, lineCount: number): string;
/**
 * Decide whether a pasted chunk is large enough to hide behind a marker.
 *
 * Pure: a chunk is "large" when its newline count reaches the line threshold or
 * its length reaches the char threshold. Small chunks are spliced verbatim by
 * the caller; large ones are routed through {@link coalescePaste}.
 *
 * @param chunk      the assembled paste text
 * @param thresholds the cut-offs to test against (defaults to {@link PASTE_THRESHOLDS})
 */
export declare function classifyPaste(chunk: string, thresholds?: PasteThresholds): "inline" | "coalesce";
/**
 * The immutable marker → body store.
 *
 * `bodies` maps each ordinal number to the exact text it hides; `minted`
 * is the running count that drives the next ordinal. The store is replaced (not
 * mutated) on every coalesce, so the surface holds it as a plain value and React
 * reconciliation stays correct.
 */
export interface PasteVault {
    /** Ordinal number → the original pasted text it stands for. */
    readonly bodies: ReadonlyMap<number, string>;
    /** How many markers have been minted so far (the next ordinal is this + 1). */
    readonly minted: number;
}
/** A fresh, empty vault. */
export declare const EMPTY_PASTE_VAULT: PasteVault;
/**
 * The outcome of folding a large paste into a vault.
 *
 * `marker` is the placeholder token the caller splices into the composer at the
 * caret; `vault` is the grown store to carry forward.
 */
export interface PasteCapture {
    /** The placeholder token to insert in place of the hidden body. */
    readonly marker: string;
    /** The vault grown by this capture. */
    readonly vault: PasteVault;
}
/**
 * Mint a marker for a large paste and record its body in a fresh vault.
 *
 * Pure: derives the next ordinal from `vault.minted`, formats the marker with
 * the hidden line count, and returns a new vault with the body recorded. The
 * caller is expected to have already classified `body` as `coalesce`; passing a
 * small body still works but is rarely useful.
 *
 * @param vault the store to grow (defaults to {@link EMPTY_PASTE_VAULT})
 * @param body  the full pasted text to hide
 */
export declare function coalescePaste(body: string, vault?: PasteVault): PasteCapture;
/**
 * Grow an existing paste body with a follow-on chunk, reminting its marker.
 *
 * The continuation path for a paste the terminal split across reads: the extra
 * text is appended to `ordinal`'s stored body and a fresh marker (same ordinal,
 * updated line count) is returned so the surface can swap the token already
 * spliced into the buffer. `minted` is unchanged — no new ordinal is consumed.
 * An unknown ordinal starts from an empty body, so the call never throws.
 *
 * @param ordinal the marker ordinal to grow
 * @param extra   the follow-on pasted text to append
 * @param vault   the store holding the ordinal's current body
 */
export declare function appendToPaste(ordinal: number, extra: string, vault: PasteVault): PasteCapture;
/**
 * The line count of an ordinal's stored body — the surface consults this
 * against {@link PASTE_MARKER_LINE_CAP} to decide whether a continuation chunk
 * may still append or must roll over into a fresh marker. Zero for an unknown
 * ordinal or an empty body.
 */
export declare function pasteLines(vault: PasteVault, ordinal: number): number;
/**
 * Rewrite every paste marker in a buffer back to the text it stands for.
 *
 * Pure: scans the buffer for marker tokens and replaces each with its vault
 * body. A marker with no matching vault entry (e.g. the user deleted half a
 * token, or pasted a look-alike) is left verbatim, so expansion never throws
 * and never loses unrelated text. This is the inverse of {@link coalescePaste}
 * and is run once at submit time.
 *
 * @param buffer the composer text possibly containing markers
 * @param vault  the store minted during the current edit
 */
export declare function expandMarkers(buffer: string, vault: PasteVault): string;
/**
 * Report whether a buffer still contains any minted paste marker.
 *
 * A pure convenience the surface uses to skip the expansion pass entirely when
 * nothing was coalesced.
 *
 * @param buffer the composer text to scan
 * @param vault  the store of minted markers
 */
export declare function hasMarkers(buffer: string, vault: PasteVault): boolean;
