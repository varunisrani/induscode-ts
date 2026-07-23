// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Keymap — pure translation of raw terminal key events into console intents.
 *
 * The console's `useInput` handler is a thin shell: it forwards the `(input,
 * key)` pair Ink hands it straight into {@link readKey}, which classifies the
 * keystroke into one of the console's own {@link ConsoleIntent} verbs. All the
 * branching — modifier combos, arrow navigation, the chorded escape/clear
 * double-taps — lives here as a pure function over plain data, so it can be
 * unit-tested without mounting Ink and so the component never grows a tangle of
 * `if (key.ctrl && input === "u")` conditionals inline.
 *
 * The input shape is dictated by the framework hook: Ink's `useInput` invokes
 * its handler with `(input: string, key: Key)` where {@link KeyChord} mirrors
 * Ink's `Key` flag bag (arrows, return, escape, ctrl, shift, tab, backspace,
 * delete, meta, …). We re-declare the bag *structurally* here — a plain record
 * of booleans plus the literal text — so the keymap depends on a data shape,
 * not on importing the hook itself. The live handler passes Ink's `key` value
 * directly; it is assignable because the field names match.
 *
 * The output is the console's own intent vocabulary, NOT a mirror of any
 * upstream action enum. An intent is a small tagged record: a `verb` plus the
 * minimal payload the reducer/surface needs to act (the literal text for an
 * insert, the signed delta for a caret move). The surface maps each intent to a
 * {@link ConsoleEvent} dispatch or a host callback; the keymap itself performs
 * no effects.
 *
 * Chording (double-tap escape → tree, double-tap clear → exit) is *stateful*
 * across keystrokes, so it is kept out of the pure classifier: {@link readKey}
 * is memoryless, and {@link advanceChord} folds a prior {@link ChordLatch} plus
 * a fresh intent into the next latch, reporting whether a chord fired. The
 * surface owns the latch value and the timeout that expires it.
 */
import type { ModalKind } from "../contract";
/**
 * The boolean flag bag the framework input hook reports alongside the typed
 * text — re-declared structurally so this module owns no hook import.
 *
 * Every field is the framework's own naming for the corresponding physical key
 * or modifier. The live `useInput` handler passes its `key` argument straight
 * in; it satisfies this shape by field-name compatibility.
 */
export interface KeyChord {
    readonly upArrow: boolean;
    readonly downArrow: boolean;
    readonly leftArrow: boolean;
    readonly rightArrow: boolean;
    readonly pageUp: boolean;
    readonly pageDown: boolean;
    readonly return: boolean;
    readonly escape: boolean;
    readonly ctrl: boolean;
    readonly shift: boolean;
    readonly tab: boolean;
    readonly backspace: boolean;
    readonly delete: boolean;
    readonly meta: boolean;
}
/**
 * The console's own keystroke-intent verbs.
 *
 * Deliberately *not* a mirror of any upstream keybinding enum: each verb names
 * what the console does, grouped by concern.
 *
 *   Editing
 *     - `text:type`        — printable text to splice at the caret.
 *     - `text:newline`     — insert a hard line break (soft submit guard).
 *     - `edit:erasePrev`   — delete the grapheme before the caret.
 *     - `edit:eraseNext`   — delete the grapheme after the caret.
 *     - `edit:clearLine`   — wipe the whole composer buffer.
 *
 *   Caret / navigation
 *     - `nav:left` / `nav:right`   — step the caret one column.
 *     - `nav:home` / `nav:end`     — jump to buffer start / end.
 *     - `nav:up` / `nav:down`      — recall older / newer history (or move in a list).
 *
 *   Session control
 *     - `flow:submit`      — commit the buffer as a turn.
 *     - `flow:dismiss`     — escape: close an overlay / cancel completion.
 *     - `flow:accept`      — tab: accept the highlighted completion.
 *     - `flow:interrupt`   — abort an in-flight turn.
 *     - `flow:suspend`     — background the process (job control).
 *     - `flow:cycleModel`  — rotate to the next model.
 *
 *   Model / reasoning
 *     - `model:cycleThinking` — advance the reasoning-effort ladder one step (via /thinking command).
 *
 *   Permission mode
 *     - `mode:cyclePermission` — cycle through ALL permission modes (Shift+Tab),
 *       advancing one step per press: default → acceptEdits → plan → bypass →
 *       (wrap) default. In `plan` mode every mutating tool is blocked; in `bypass`
 *       every tool is auto-allowed.
 *     - `mode:togglePlan` — toggle read-only plan mode on/off. Drives `/plan`; no
 *       longer bound to Shift+Tab (which now cycles all modes). In plan mode every
 *       mutating tool is blocked at the permission gate.
 *
 *   Queue
 *     - `queue:dequeue`    — pull the most recently queued input back into the
 *       composer so it can be edited or dropped.
 *
 *   Input sources
 *     - `input:pasteImage` — stage an image off the OS clipboard and splice its
 *       temp path into the buffer.
 *     - `input:externalEditor` — hand the buffer to `$EDITOR` and read it back.
 *
 *   Overlays
 *     - `overlay:open`     — raise a global overlay (settings / sessions /
 *       model pickers) directly from a control chord, without typing a slash
 *       command. The target overlay rides in {@link ConsoleIntent.overlay}.
 *
 *   View toggles
 *     - `view:expandTools` — flip whether collapsed tool output (bash / file /
 *       grep / edit cards) is rendered in full or summarised.
 *     - `view:toggleReasoning` — show/hide the assistant's thinking blocks live.
 *
 *   Inert
 *     - `none`             — the keystroke carries no console meaning.
 */
export type ConsoleVerb = "text:type" | "text:newline" | "edit:erasePrev" | "edit:eraseNext" | "edit:clearLine" | "nav:left" | "nav:right" | "nav:home" | "nav:end" | "nav:up" | "nav:down" | "flow:submit" | "flow:dismiss" | "flow:accept" | "flow:interrupt" | "flow:suspend" | "flow:cycleModel" | "model:cycleThinking" | "mode:cyclePermission" | "mode:togglePlan" | "queue:dequeue" | "queue:steer" | "input:pasteImage" | "input:externalEditor" | "overlay:open" | "view:expandTools" | "view:toggleReasoning" | "none";
/**
 * A classified keystroke: a {@link ConsoleVerb} plus the small payload a verb
 * may carry — the literal text for a `text:type` insert, or the target overlay
 * for an `overlay:open`. Every other verb is self-contained, so both payload
 * fields are optional and present only on their owning verb.
 */
export interface ConsoleIntent {
    /** What the keystroke means to the console. */
    readonly verb: ConsoleVerb;
    /** The literal text to splice, present only for `text:type`. */
    readonly text?: string;
    /** The overlay to raise, present only for `overlay:open`. */
    readonly overlay?: ModalKind;
}
/** The inert intent — a keystroke the console ignores. */
export declare const NO_INTENT: ConsoleIntent;
/**
 * Classify one raw key event into a single {@link ConsoleIntent}.
 *
 * Pure and memoryless: identical inputs always yield identical intents, and no
 * cross-keystroke state (chords, timeouts) is consulted — that is the surface's
 * job via {@link advanceChord}. Resolution order is deliberate: control combos
 * and named keys win over raw text, so a `Ctrl+U` never also types "u".
 *
 * @param input the literal text the hook reports (may be empty for a bare key)
 * @param key   the framework flag bag describing the physical key + modifiers
 */
export declare function readKey(input: string, key: KeyChord): ConsoleIntent;
/**
 * Which verbs participate in a double-tap chord, and what the second tap fires.
 *
 * A first tap of `flow:dismiss` (escape) primes a chord; a second tap within
 * the surface's window fires `dismiss×2` (open the transcript tree). A first tap
 * of `edit:clearLine` (Ctrl+U on an already-empty buffer) primes a chord whose
 * second tap fires `clear×2` (request exit). Any other intent breaks the latch.
 */
export type ChordOutcome = "dismiss×2" | "clear×2";
/**
 * The cross-keystroke latch the surface carries between key events.
 *
 * `armed` is the verb a prior keystroke primed (or `null` when no chord is in
 * flight). The surface resets it to `null` when its timeout expires.
 */
export interface ChordLatch {
    /** The verb a previous keystroke armed, or `null` when nothing is primed. */
    readonly armed: string | null;
}
/** A fresh, unarmed latch. */
export declare const NO_CHORD: ChordLatch;
/**
 * The result of folding a fresh intent into the prior chord latch.
 *
 * `next` is the latch to carry forward; `fired` is the chord outcome when this
 * keystroke completed a double-tap, otherwise `null`.
 */
export interface ChordStep {
    /** The latch to carry into the next keystroke. */
    readonly next: ChordLatch;
    /** The chord that fired on this keystroke, or `null` if none did. */
    readonly fired: ChordOutcome | null;
}
/**
 * Fold a fresh {@link ConsoleIntent} into the prior {@link ChordLatch}.
 *
 * Pure: given the same latch and intent it always yields the same step. If the
 * incoming verb matches the armed verb and that verb is chord-eligible, the
 * chord fires and the latch resets. If the incoming verb is chord-eligible but
 * the latch was empty (or armed with a different verb), it arms. Any other
 * intent clears the latch. The timeout that expires a stale latch is the
 * surface's responsibility (it simply resets to {@link NO_CHORD}).
 *
 * @param latch  the latch carried from the previous keystroke
 * @param intent the freshly classified intent for this keystroke
 */
export declare function advanceChord(latch: ChordLatch, intent: ConsoleIntent): ChordStep;
