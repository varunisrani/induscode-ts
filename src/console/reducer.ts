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
 */
import { EMPTY_CONSOLE_STATE, NO_MODAL, transitionModal, type ConsoleEvent, type ConsoleState } from "./contract.js";

function clamp(offset: number, max: number) {
  if (offset < 0) return 0;
  if (offset > max) return max;
  return offset;
}

function spliceAt(text: string, at: number, insert: string) {
  return text.slice(0, at) + insert + text.slice(at);
}

function withBuffer(state: ConsoleState, text: string, caret: number) {
  return { ...state, buffer: text, caret: clamp(caret, text.length) };
}

function setBuffer(state: ConsoleState, text: string) {
  return withBuffer(state, text, text.length);
}

function insertBuffer(state: ConsoleState, text: string) {
  if (text.length === 0) return state;
  const at = clamp(state.caret, state.buffer.length);
  return withBuffer(state, spliceAt(state.buffer, at, text), at + text.length);
}

function erasePrev(state: ConsoleState) {
  const at = clamp(state.caret, state.buffer.length);
  if (at === 0) return state;
  const next = state.buffer.slice(0, at - 1) + state.buffer.slice(at);
  return withBuffer(state, next, at - 1);
}

function eraseNext(state: ConsoleState) {
  const at = clamp(state.caret, state.buffer.length);
  if (at >= state.buffer.length) return state;
  const next = state.buffer.slice(0, at) + state.buffer.slice(at + 1);
  return withBuffer(state, next, at);
}

function pushHistory(state: ConsoleState, text: string) {
  const trimmed = text.trim();
  const base = { ...state, historyAt: null, stash: "" };
  if (trimmed.length === 0) return base;
  const last = state.history[state.history.length - 1];
  if (last === text) return base;
  return { ...base, history: [...state.history, text] };
}

function historyBack(state: ConsoleState) {
  if (state.history.length === 0) return state;
  const atEnd = state.historyAt === null;
  const index = atEnd ? state.history.length - 1 : Math.max(0, state.historyAt - 1);
  const stash = atEnd ? state.buffer : state.stash;
  const recalled = state.history[index];
  return { ...withBuffer(state, recalled, recalled.length), historyAt: index, stash };
}

function historyForward(state: ConsoleState) {
  if (state.historyAt === null) return state;
  const next = state.historyAt + 1;
  if (next >= state.history.length) {
    const stash = state.stash;
    return { ...withBuffer(state, stash, stash.length), historyAt: null, stash: "" };
  }
  const recalled = state.history[next];
  return { ...withBuffer(state, recalled, recalled.length), historyAt: next };
}

function appendRow(state: ConsoleState, row: ConsoleState["rows"][number]) {
  return { ...state, rows: [...state.rows, row] };
}

function patchRow(state: ConsoleState, id: string, text: string) {
  let found = false;
  const rows = state.rows.map((row) => {
    if (row.id !== id) return row;
    found = true;
    return { ...row, text };
  });
  return found ? { ...state, rows } : state;
}

/**
 * Fold a {@link ConsoleEvent} into a {@link ConsoleState}, returning a fresh state.
 */
export function consoleReducer(state: ConsoleState, event: ConsoleEvent): ConsoleState {
  switch (event.type) {
    // Composer buffer & caret
    case "buffer:set":
      return setBuffer(state, event.text);
    case "buffer:insert":
      return insertBuffer(state, event.text);
    case "buffer:replaceSpan": {
      const at = state.buffer.indexOf(event.find);
      if (at < 0) return state;
      const buffer = state.buffer.slice(0, at) + event.replaceWith + state.buffer.slice(at + event.find.length);
      const spanEnd = at + event.find.length;
      const caret = state.caret >= spanEnd
        ? state.caret + (event.replaceWith.length - event.find.length)
        : state.caret > at
        ? at + event.replaceWith.length
        : state.caret;
      return { ...state, buffer, caret: clamp(caret, buffer.length) };
    }
    case "buffer:erasePrev":
      return erasePrev(state);
    case "buffer:eraseNext":
      return eraseNext(state);
    case "caret:move":
      return { ...state, caret: clamp(state.caret + event.delta, state.buffer.length) };
    case "caret:jump":
      return { ...state, caret: clamp(event.offset, state.buffer.length) };
    // History ring
    case "history:push":
      return pushHistory(state, event.text);
    case "history:back":
      return historyBack(state);
    case "history:forward":
      return historyForward(state);
    // Transcript view
    case "rows:set":
      return { ...state, rows: [...event.rows] };
    case "rows:append":
      return appendRow(state, event.row);
    case "rows:patch":
      return patchRow(state, event.id, event.text);
    case "block:append":
      return { ...state, blocks: [...state.blocks, event.block] };
    case "blocks:clear":
      return state.blocks.length === 0 ? state : { ...state, blocks: [] };
    // Overlays, status, theme, toggles, busy
    case "modal:open":
      return { ...state, modal: transitionModal(event.kind, event.payload) };
    case "modal:close":
      return { ...state, modal: NO_MODAL };
    case "status:set":
      return { ...state, status: event.status };
    case "status:clear": {
      if (state.status === void 0) return state;
      const { status: _drop, ...rest } = state;
      return rest;
    }
    case "scheme:set":
      return { ...state, scheme: event.scheme };
    case "toggle:reasoning":
      return { ...state, showReasoning: !state.showReasoning };
    case "toggle:images":
      return { ...state, showImages: !state.showImages };
    case "busy:set": {
      if (event.busy) {
        const { status: _drop, ...rest } = state;
        return { ...rest, busy: true };
      }
      return { ...state, busy: false };
    }
    case "tick":
      return { ...state, tick: state.tick + 1 };
    default: {
      const _never = event;
      return _never;
    }
  }
}

/**
 * Build the initial {@link ConsoleState} a console mounts with.
 */
export function initConsoleState(overrides?: Partial<ConsoleState>): ConsoleState {
  return overrides === void 0 ? EMPTY_CONSOLE_STATE : { ...EMPTY_CONSOLE_STATE, ...overrides };
}