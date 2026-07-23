// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Dialog bridge — the ask / tell seam over the link transport.
 *
 * The agent (and the extensions it hosts) needs to interact with whoever drives
 * the channel: ask a multiple-choice question, confirm a destructive action,
 * prompt for free text, flash a notice, set a status line. Rather than a
 * per-interaction handler ladder, the whole surface reduces to two primitives:
 *
 *   - {@link DialogBridge.ask} — one generic round-trip: emit an {@link Ask}
 *     frame, suspend until a correlated {@link AskAnswer} arrives, and resolve
 *     with its value (or a caller-supplied fallback when the deadline lapses or
 *     the driver dismisses the request).
 *   - {@link DialogBridge.tell} — one generic fire-and-forget: emit a {@link Tell}
 *     frame and return immediately.
 *
 * Concrete dialog methods (select / confirm / input / notify / status / title)
 * are expressed as a *data table* of named entries keyed by interaction kind, not
 * as bespoke method bodies. {@link makeDialogMethods} closes that table over a
 * single bridge so a caller gets typed conveniences while the bridge keeps the
 * lone round-trip / fire-and-forget implementation.
 */
import type { AskAnswer, ChannelTimings, DialogBridge, NdjsonFramer, WritableLine } from "../contract";
/** Everything {@link createDialogBridge} needs to emit frames and time out. */
export interface DialogBridgeDeps {
    /** Sink the ask/tell frames are written to (already framed). */
    readonly out: WritableLine;
    /** Framer used to encode each frame to a line. */
    readonly framer: NdjsonFramer;
    /** Timings; only {@link ChannelTimings.dialogMs} is consulted here. */
    readonly timings: ChannelTimings;
}
/**
 * A {@link DialogBridge} whose pending answers are fed by an external reader.
 *
 * The bridge itself does not read the stream — the server owns the single
 * decode loop and routes any inbound {@link AskAnswer} frame to
 * {@link LinkedDialogBridge.deliver}. This keeps one reader over the transport
 * (the server) rather than competing consumers.
 */
export interface LinkedDialogBridge extends DialogBridge {
    /**
     * Resolve the pending {@link DialogBridge.ask} that minted `answer.id`.
     *
     * A no-op when no ask is pending under that id (a late or duplicate answer),
     * so a misbehaving driver cannot throw into the read loop.
     *
     * @param answer the inbound answer frame
     * @returns whether a pending ask was settled by this answer
     */
    deliver(answer: AskAnswer): boolean;
    /**
     * Reject every still-pending ask with its fallback (used on shutdown), so no
     * awaiting handler is left suspended when the link closes.
     */
    drain(): void;
}
/**
 * Construct a {@link LinkedDialogBridge} over an injected sink + framer.
 *
 * `ask` writes an {@link Ask} frame, registers the pending resolver under a
 * fresh id, and arms a fallback timer; `deliver` settles the matching pending
 * resolver when the answer returns. `tell` writes a {@link Tell} frame and
 * returns at once. No stdio, no global state — every dependency is injected.
 */
export declare function createDialogBridge(deps: DialogBridgeDeps): LinkedDialogBridge;
/**
 * One concrete dialog method expressed as data, not code.
 *
 * `kind` is the wire interaction kind; `mode` selects which primitive carries
 * it (a round-trip `ask` or a fire-and-forget `tell`); `fallback` is the value a
 * round-trip resolves with on timeout / dismissal (unused for `tell`). The whole
 * dialog surface is this table — adding an interaction is adding a row.
 */
export interface DialogSpec {
    /** The wire interaction kind (the `Ask.kind` / `Tell.kind`). */
    readonly kind: string;
    /** Whether the method round-trips for an answer or is fire-and-forget. */
    readonly mode: "ask" | "tell";
    /** The value an `ask` resolves with when no answer arrives in time. */
    readonly fallback?: unknown;
}
/**
 * The canonical dialog table: every concrete interaction the channel exposes,
 * each one row of data over the two primitives.
 *
 * Replaces a copied switch of bespoke UI-context methods: the bridge has exactly
 * one round-trip and one fire-and-forget body, and this table names the kinds.
 */
export declare const DIALOG_TABLE: Readonly<{
    select: {
        kind: string;
        mode: "ask";
        fallback: null;
    };
    confirm: {
        kind: string;
        mode: "ask";
        fallback: boolean;
    };
    input: {
        kind: string;
        mode: "ask";
        fallback: null;
    };
    editor: {
        kind: string;
        mode: "ask";
        fallback: null;
    };
    notify: {
        kind: string;
        mode: "tell";
    };
    status: {
        kind: string;
        mode: "tell";
    };
    title: {
        kind: string;
        mode: "tell";
    };
}>;
/** The set of named dialog methods derived from {@link DIALOG_TABLE}. */
export type DialogMethods = {
    [K in keyof typeof DIALOG_TABLE]: (typeof DIALOG_TABLE)[K]["mode"] extends "ask" ? (payload?: unknown) => Promise<unknown> : (payload?: unknown) => void;
};
/**
 * Close the {@link DIALOG_TABLE} over one {@link DialogBridge} into typed,
 * named convenience methods.
 *
 * Each `ask` row becomes a thunk that round-trips through `bridge.ask` with the
 * row fallback; each `tell` row becomes a thunk that fires through `bridge.tell`.
 * There is no per-method choreography — the bodies are generated from the table.
 *
 * @param bridge the round-trip / fire-and-forget primitive pair
 * @returns the named method object projected from the table
 */
export declare function makeDialogMethods(bridge: DialogBridge): DialogMethods;
