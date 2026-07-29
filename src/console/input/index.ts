/**
 * Console input — public barrel for the pure composer-input modules.
 */
export type { KeyChord, ConsoleVerb, ConsoleIntent, ChordOutcome, ChordLatch, ChordStep } from "./keymap.js";
export { NO_INTENT, readKey, NO_CHORD, advanceChord } from "./keymap.js";
export type { PasteThresholds, PasteVault, PasteCapture } from "./paste.js";
export {
  PASTE_THRESHOLDS,
  PASTE_BURST_GAP_MS,
  PASTE_CONTINUATION_MS,
  PASTE_MARKER_LINE_CAP,
  EMPTY_PASTE_VAULT,
  pasteMarker,
  classifyPaste,
  coalescePaste,
  appendToPaste,
  pasteLines,
  expandMarkers,
  hasMarkers
} from "./paste.js";
export type { CompletionKind, Suggestion, TokenSpan, CompletionResult, DirEntry, DirReader } from "./complete.js";
export { completeAt, applySuggestion } from "./complete.js";
export { createDirReader } from "./dir-reader.js";