/**
 * Keymap — pure translation of raw terminal key events into console intents.
 */
import type { ModalKind } from "../contract.js";

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

export type ConsoleVerb =
  | "text:type"
  | "text:newline"
  | "edit:erasePrev"
  | "edit:eraseNext"
  | "edit:clearLine"
  | "nav:left"
  | "nav:right"
  | "nav:home"
  | "nav:end"
  | "nav:up"
  | "nav:down"
  | "flow:submit"
  | "flow:dismiss"
  | "flow:accept"
  | "flow:interrupt"
  | "flow:suspend"
  | "flow:cycleModel"
  | "model:cycleThinking"
  | "mode:cyclePermission"
  | "mode:togglePlan"
  | "queue:dequeue"
  | "queue:steer"
  | "input:pasteImage"
  | "input:externalEditor"
  | "overlay:open"
  | "view:expandTools"
  | "view:toggleReasoning"
  | "none";

export interface ConsoleIntent {
  readonly verb: ConsoleVerb;
  readonly text?: string;
  readonly overlay?: ModalKind;
}

/** The inert intent — a keystroke the console ignores. */
export const NO_INTENT: ConsoleIntent = { verb: "none" };

function typed(text: string): ConsoleIntent {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized.length === 0 ? NO_INTENT : { verb: "text:type", text: normalized };
}

function isPrintable(input: string) {
  if (input.length === 0) return false;
  if (input.length > 1) return true;
  const code = input.charCodeAt(0);
  return code >= 32 && code !== 127;
}

/**
 * Classify one raw key event into a single {@link ConsoleIntent}.
 */
export function readKey(input: string, key: KeyChord): ConsoleIntent {
  if (key.ctrl && !key.meta) {
    switch (input) {
      case "c":
        return { verb: "flow:interrupt" };
      case "z":
        return { verb: "flow:suspend" };
      case "u":
        return { verb: "edit:clearLine" };
      case "a":
        return { verb: "nav:home" };
      case "e":
        return { verb: "nav:end" };
      case "j":
        return { verb: "text:newline" };
      case "n":
        return { verb: "flow:cycleModel" };
      case "p":
        return { verb: "flow:cycleModel" };
      case "t":
        return { verb: "view:toggleReasoning" };
      case "v":
        return { verb: "input:pasteImage" };
      case "g":
        return { verb: "input:externalEditor" };
      case "r":
        return { verb: "overlay:open", overlay: "sessions" };
      case "x":
        return { verb: "queue:steer" };
      case "l":
        return { verb: "overlay:open", overlay: "models" };
      case "o":
        return { verb: "view:expandTools" };
      default:
        return NO_INTENT;
    }
  }
  if (key.meta && key.upArrow) return { verb: "queue:dequeue" };
  if (key.return) {
    return key.shift ? { verb: "text:newline" } : { verb: "flow:submit" };
  }
  if (key.escape) return { verb: "flow:dismiss" };
  if (key.tab) return key.shift ? { verb: "mode:cyclePermission" } : { verb: "flow:accept" };
  if (key.backspace || key.delete || input === "\x7F" || input === "\b") {
    return { verb: "edit:erasePrev" };
  }
  if (key.leftArrow) return { verb: "nav:left" };
  if (key.rightArrow) return { verb: "nav:right" };
  if (key.upArrow) return { verb: "nav:up" };
  if (key.downArrow) return { verb: "nav:down" };
  if (key.pageUp) return { verb: "nav:home" };
  if (key.pageDown) return { verb: "nav:end" };
  return isPrintable(input) ? typed(input) : NO_INTENT;
}

export type ChordOutcome = "dismiss×2" | "clear×2";

export interface ChordLatch {
  readonly armed: string | null;
}

export const NO_CHORD: ChordLatch = { armed: null };

export interface ChordStep {
  readonly next: ChordLatch;
  readonly fired: ChordOutcome | null;
}

const CHORD_VERBS: Partial<Record<ConsoleVerb, ChordOutcome>> = {
  "flow:dismiss": "dismiss×2",
  "edit:clearLine": "clear×2"
};

export function advanceChord(latch: ChordLatch, intent: ConsoleIntent): ChordStep {
  const outcome = CHORD_VERBS[intent.verb];
  if (outcome === void 0) {
    return { next: NO_CHORD, fired: null };
  }
  if (latch.armed === intent.verb) {
    return { next: NO_CHORD, fired: outcome };
  }
  return { next: { armed: intent.verb }, fired: null };
}