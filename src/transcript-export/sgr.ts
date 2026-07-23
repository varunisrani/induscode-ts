// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * SGR painter — a table-driven ANSI Select-Graphic-Rendition state machine that
 * converts a terminal byte stream into a sequence of styled HTML spans.
 *
 * Terminal programs encode color and emphasis with CSI sequences of the form
 * `ESC [ p1 ; p2 ; … m` (the trailing `m` is the SGR final byte). The parameters
 * are small integers whose meaning is fixed by ECMA-48 / ISO 6429: `0` resets,
 * `1`/`3`/`4` switch on weight/italic/underline, `30`–`37` and `90`–`97` set the
 * foreground from the sixteen-color palette, `40`–`47` and `100`–`107` set the
 * background, and the two extended introducers `38`/`48` pull a 256-index or a
 * 24-bit triple out of the following parameters.
 *
 * Rather than a long `switch`, the semantics live in a *table*: each handled code
 * maps to an {@link SgrMutation} — the partial {@link SgrState} that code imposes —
 * and the painter folds the matched mutation over the running state. Extending the
 * machine is adding a row, never editing control flow. The two extended
 * introducers are the only parametric cases and are handled by a small reader
 * that consumes their trailing parameters.
 *
 * The pipeline is three stages:
 *   1. {@link tokenizeSgr} splits the raw stream into an alternation of text runs
 *      and SGR parameter lists ({@link SgrToken}s).
 *   2. {@link foldSgr} folds an SGR parameter list into the running
 *      {@link SgrState} using the {@link SGR_CODE_TABLE} dispatch table.
 *   3. {@link paintSgr} drives the two over the whole stream, wrapping each text
 *      run in a `<span>` whose class list and inline color style reflect the state
 *      in force.
 *
 * The {@link SgrState} / {@link SgrToken} / {@link SgrMutation} vocabulary is the
 * briefing contract's; the SGR code meanings are the published standard's.
 */
import { type SgrMutation, type SgrState, type SgrToken } from "../briefing/contract";
/**
 * The read-only public view of the SGR dispatch table — each fixed-meaning SGR
 * code mapped to the {@link SgrMutation} it imposes. Exported so callers can
 * introspect the handled code space (the extended `38`/`48` introducers are not
 * present here; they are parametric and resolved by the painter).
 */
export declare const SGR_CODE_TABLE: ReadonlyMap<number, SgrMutation>;
/**
 * Fold one SGR parameter list into a running {@link SgrState}, returning the next
 * state.
 *
 * Walks the parameters left to right. A fixed-meaning code is resolved through
 * the {@link CODE_TABLE} and its mutation merged over the state. The two extended
 * introducers `38` (foreground) and `48` (background) are handled inline: the
 * reader consumes their trailing `5;n` or `2;r;g;b` parameters and the resolved
 * color is written to the matching channel. An empty list is the bare `ESC[m`
 * form and is treated as a reset, matching terminal behavior.
 *
 * Pure: the input state is never mutated; a fresh object is returned.
 *
 * @param state  the style in force before this sequence
 * @param params the numeric parameter list of one SGR sequence
 */
export declare function foldSgr(state: SgrState, params: readonly number[]): SgrState;
/**
 * Split a raw terminal stream into an ordered list of {@link SgrToken}s.
 *
 * Scans for CSI sequences of the form `ESC [ … m`. Each such sequence becomes an
 * `sgr` token carrying its parsed numeric parameters (an empty selector yields an
 * empty list, the bare-reset form). The runs of ordinary characters between
 * sequences become `text` tokens. Non-SGR control sequences — any CSI whose final
 * byte is not `m`, plus bare escapes — are dropped: they carry cursor and screen
 * commands that have no place in flowed HTML, so swallowing them keeps the output
 * clean while preserving every printable character.
 *
 * Empty `text` runs are never emitted, so the token stream is dense.
 *
 * @param input the raw ANSI/terminal byte stream
 */
export declare function tokenizeSgr(input: string): SgrToken[];
/**
 * Paint an ANSI/terminal byte stream into a string of styled HTML spans.
 *
 * Drives the three stages end to end: tokenize the stream, fold each SGR sequence
 * into the running {@link SgrState}, and wrap each intervening text run in a span
 * reflecting the state in force when that run was emitted. Text is HTML-escaped;
 * non-SGR control sequences are dropped; runs under the neutral state are emitted
 * without a wrapping span. The result is safe to splice directly into a transcript
 * page.
 *
 * The state resets to {@link SGR_INITIAL_STATE} only on an explicit reset code (or
 * a bare `ESC[m`); it otherwise persists across text runs, so a color set once
 * stays in force until changed, exactly as a terminal renders it.
 *
 * @param input the raw ANSI/terminal byte stream to convert
 * @returns an HTML fragment of escaped text and styled `<span>`s
 */
export declare function paintSgr(input: string): string;
