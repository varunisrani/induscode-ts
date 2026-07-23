// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Console input — public barrel for the pure composer-input modules.
 *
 * Three decoupled, Ink-free, fully-tested modules the surface's `useInput`
 * handler composes:
 *
 *   - **keymap** — classify a raw `(input, key)` event into a console
 *     {@link ConsoleIntent}, and fold double-tap chords with {@link advanceChord}.
 *   - **paste** — collapse a large clipboard burst behind a {@link PasteVault}
 *     marker ({@link coalescePaste}) and re-expand at submit ({@link expandMarkers}).
 *   - **complete** — produce structured slash/path {@link Suggestion}s
 *     ({@link completeAt}) and splice an accepted one back ({@link applySuggestion}).
 *
 * The surface owns the live values (the chord latch, the paste vault, the
 * highlighted-suggestion index) and the timers; every decision lives in these
 * pure functions.
 */
export type { KeyChord, ConsoleVerb, ConsoleIntent, ChordOutcome, ChordLatch, ChordStep, } from "./keymap";
export { NO_INTENT, readKey, NO_CHORD, advanceChord } from "./keymap";
export type { PasteThresholds, PasteVault, PasteCapture, } from "./paste";
export { PASTE_THRESHOLDS, PASTE_BURST_GAP_MS, PASTE_CONTINUATION_MS, PASTE_MARKER_LINE_CAP, EMPTY_PASTE_VAULT, pasteMarker, classifyPaste, coalescePaste, appendToPaste, pasteLines, expandMarkers, hasMarkers, } from "./paste";
export type { CompletionKind, Suggestion, TokenSpan, CompletionResult, DirEntry, DirReader, } from "./complete";
export { completeAt, applySuggestion } from "./complete";
export { createDirReader } from "./dir-reader";
