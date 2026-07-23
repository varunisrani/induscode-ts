// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * WorkingIndicator — the live "agent is working" affordance.
 *
 * While a turn is in flight (`busy`) this draws an animated braille spinner, a
 * label, an elapsed-seconds clock, and an "esc to interrupt" hint. The label is
 * a rotating whimsical word (changing every few seconds, induscode-style) for
 * the general thinking/streaming case, and a concrete phase label while the
 * agent runs tools or compacts context.
 *
 * It renders nothing when idle, and self-drives its animation via a short
 * interval that ticks ONLY while busy (torn down the moment `busy` clears), so an
 * idle console does no spinner work. It is a sibling row above the
 * {@link Composer} and does NOT consume the sticky status toast — so a previous
 * toast (e.g. the permission-mode line) can never mask that the agent is working.
 */
import type { InkThemeAdapter } from "indusagi/react-ink";
/**
 * The rotating "thinking" words shown while the agent reasons/streams. Whimsical
 * present participles, in the spirit of induscode's spinner — purely cosmetic.
 */
export declare const WORKING_WORDS: readonly ["Cogitating", "Pondering", "Noodling", "Simmering", "Brewing", "Percolating", "Conjuring", "Tinkering", "Wrangling", "Synthesizing", "Computing", "Musing", "Scheming", "Hatching", "Whirring", "Crunching", "Spelunking", "Untangling", "Marinating", "Ruminating", "Architecting", "Finagling", "Concocting", "Deliberating", "Orchestrating", "Calibrating", "Channeling", "Vibing", "Forging", "Assembling"];
/** Pick a working word by (wrapping, non-negative) index. Exported for testing. */
export declare function pickWord(index: number): string;
/** What the {@link WorkingIndicator} renders. */
export interface WorkingIndicatorProps {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** Whether a turn is in flight. When false the indicator renders nothing. */
    readonly busy: boolean;
    /** The conductor snapshot phase, used to pick a concrete label when relevant. */
    readonly phase?: string;
}
/**
 * The concrete label for the phases where a specific word is more useful than a
 * whimsical one. Returns null for the general thinking/streaming case (the caller
 * then shows a rotating {@link WORKING_WORDS} word instead). Exported for testing.
 */
export declare function phaseLabel(phase: string | undefined): string | null;
/**
 * Render the animated working row, or nothing when idle.
 *
 * @param props the theme, the busy flag, and the snapshot phase
 */
export declare function WorkingIndicator({ theme, busy, phase, }: WorkingIndicatorProps): JSX.Element | null;
