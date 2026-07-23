// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * TerminalConsole — the top-level Ink application for the interactive console.
 *
 * This is the surface the host process renders to drive a session from a live
 * terminal. It owns one {@link consoleReducer} store, subscribes to the
 * conductor's {@link SessionSignal} stream and projects each signal into reducer
 * events (so the transcript view grows as the agent streams), renders the
 * framework `MessageList` / `Footer` / `StatusLine` plus the console's own
 * {@link Composer} / {@link StatusBar} / {@link Banner}, and translates raw key
 * events — through the pure keymap / paste / completion modules — into reducer
 * dispatches and conductor calls.
 *
 * The component is deliberately thin: every *decision* lives in a pure module
 * (the reducer, the keymap, the slash resolver, the completion source, the paste
 * coalescer). The surface holds only the live values those pure functions need
 * carried between keystrokes — the chord latch, the paste vault, the highlighted
 * suggestion index — and the timers, and it wires events in and renders state
 * out. Nothing here parses keys or mutates state inline.
 *
 * Hooks note: `useReducer` / `useRef` / `useCallback` are obtained from the
 * default React export of `indusagi/react-host` (only `useState`/`useEffect`/
 * `useMemo` are named exports there). `Box` / `Text` / `useInput` come from
 * `indusagi/react-host/ink`; the message/footer/dialog components from
 * `indusagi/react-ink`.
 */
import type { ConsoleProps } from "../contract";
export declare function TerminalConsole(props: ConsoleProps): JSX.Element;
