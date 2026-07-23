// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Composer — the prompt-input surface (the renamed input row).
 *
 * Presentational only: it renders the live buffer with a visible caret, a busy
 * affordance while a turn is in flight, and — when the parent has computed one —
 * a completion window of slash/path {@link Suggestion}s with the highlighted
 * entry marked. All key handling lives in the parent {@link TerminalConsole}'s
 * `useInput` handler (which composes the pure keymap / paste / completion
 * modules); the Composer just draws the state it is handed.
 *
 * The caret is drawn by splitting the buffer at the caret offset and inverting
 * the character under it (or a trailing space at end-of-buffer), so the surface
 * needs no terminal cursor control.
 */
import type { InkThemeAdapter } from "indusagi/react-ink";
import type { Suggestion } from "../input";
/** What the {@link Composer} renders. */
export interface ComposerProps {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** The live composer buffer. */
    readonly buffer: string;
    /** Caret offset within {@link buffer}, in characters. */
    readonly caret: number;
    /** Whether a turn is in flight (input is visually disabled). */
    readonly busy: boolean;
    /** The completion candidates to show, or empty for no window. */
    readonly suggestions: readonly Suggestion[];
    /** Index of the highlighted suggestion within {@link suggestions}. */
    readonly highlight: number;
}
/**
 * Render the prompt-input row plus any completion window.
 *
 * @param props the buffer/caret/suggestion state to display
 */
export declare function Composer({ theme, buffer, caret, busy, suggestions, highlight, }: ComposerProps): JSX.Element;
