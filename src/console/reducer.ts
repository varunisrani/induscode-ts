// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Console reducer — the single pure fold over {@link ConsoleState}.
 *
 * The whole terminal surface is reduced from one immutable {@link ConsoleState}
 * value, mutated only by dispatching a {@link ConsoleEvent} into
 * {@link consoleReducer}. This module is the one place those transitions live:
 * it is a pure function (no React, no I/O, no timers) that, given a prior state
 * and an event, returns a *fresh* state — it never mutates its input. That makes
 * every transition unit-testable in isolation and keeps the surface component a
 * thin shell that only wires events in and renders the result out.
 *
 * The transitions fall into a few families, mirroring the {@link ConsoleEvent}
 * grouping:
 *
 *   - **Composer edits** (`buffer:*`, `caret:*`) splice and navigate the live
 *     input buffer, keeping the caret clamped into `[0, buffer.length]`.
 *   - **History recall** (`history:*`) walks the submitted-input ring, stashing
 *     the live buffer on the way in and restoring it on the way out.
 *   - **Transcript view** (`rows:*`, `block:append`) appends and patches the
 *     rendered rows projected from the conductor's {@link SessionSignal} stream
 *     (the surface translates each signal into a row event).
 *   - **Overlays / status / theme / toggles / busy** flip the small UI-local
 *     flags the surface reads to decide what chrome to render.
 *
 * Live session data (messages, usage, model) is *not* stored here — it is read
 * straight from the conductor snapshot — so this state stays purely UI-local and
 * the reducer never needs to know about the agent loop.
 */
import { type ConsoleEvent, type ConsoleState } from "./contract";
/**
 * Fold a {@link ConsoleEvent} into a {@link ConsoleState}, returning a fresh
 * state.
 *
 * Pure and total: every event has a defined transition, and the input state is
 * never mutated. The `switch` is exhaustive over the event union, so adding an
 * event without handling it is a compile error.
 *
 * @param state the prior console state
 * @param event the action to apply
 */
export declare function consoleReducer(state: ConsoleState, event: ConsoleEvent): ConsoleState;
/**
 * Build the initial {@link ConsoleState} a console mounts with.
 *
 * Starts from the frozen {@link EMPTY_CONSOLE_STATE} seed and overlays any
 * caller-supplied UI preferences (scheme, the display toggles). Pure and
 * deterministic — no runtime is consulted — so the first render is stable.
 *
 * @param overrides optional UI-local preferences to seed
 */
export declare function initConsoleState(overrides?: Partial<ConsoleState>): ConsoleState;
