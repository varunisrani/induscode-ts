/**
 * Dialog bridge — the ask / tell seam over the link transport.
 */
import type {
  Ask,
  AskAnswer,
  ChannelTimings,
  DialogBridge,
  NdjsonFramer,
  WritableLine,
} from "../contract.js";

export interface DialogBridgeDeps {
  readonly out: WritableLine;
  readonly framer: NdjsonFramer;
  readonly timings: ChannelTimings;
}

export interface LinkedDialogBridge extends DialogBridge {
  deliver(answer: AskAnswer): boolean;
  drain(): void;
}

interface PendingEntry {
  settle: (value: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

function nextAskId(seq: { n: number }): string {
  seq.n += 1;
  return `ask-${Date.now().toString(36)}-${seq.n.toString(36)}`;
}

/**
 * Construct a {@link LinkedDialogBridge} over an injected sink + framer.
 */
export function createDialogBridge(deps: DialogBridgeDeps): LinkedDialogBridge {
  const pending = new Map<string, PendingEntry>();
  const seq = { n: 0 };

  function emit(frame: Ask | { type: "tell"; kind: string; payload?: unknown }): void {
    deps.out.write(deps.framer.encodeLine(frame));
  }

  function resolvePending(id: string, value: unknown): boolean {
    const entry = pending.get(id);
    if (entry === undefined) {
      return false;
    }
    pending.delete(id);
    clearTimeout(entry.timer);
    entry.settle(value);
    return true;
  }

  return {
    ask<T>(kind: string, payload: unknown, fallback: T): Promise<T> {
      const id = nextAskId(seq);
      const frame: Ask = { type: "ask", id, kind, payload };
      return new Promise<T>((resolve) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          resolve(fallback);
        }, deps.timings.dialogMs);
        if (typeof timer.unref === "function") {
          timer.unref();
        }
        pending.set(id, {
          settle: (value: unknown) => resolve(value as T),
          timer,
        });
        emit(frame);
      });
    },
    tell(kind: string, payload?: unknown): void {
      emit({ type: "tell", kind, payload });
    },
    deliver(answer: AskAnswer): boolean {
      return resolvePending(answer.id, answer.value);
    },
    drain(): void {
      for (const [, entry] of pending) {
        clearTimeout(entry.timer);
        entry.settle(undefined);
      }
      pending.clear();
    },
  };
}

export interface DialogSpec {
  readonly kind: string;
  readonly mode: "ask" | "tell";
  readonly fallback?: unknown;
}

export const DIALOG_TABLE = Object.freeze({
  select: { kind: "select", mode: "ask", fallback: null },
  confirm: { kind: "confirm", mode: "ask", fallback: false },
  input: { kind: "input", mode: "ask", fallback: null },
  editor: { kind: "editor", mode: "ask", fallback: null },
  notify: { kind: "notify", mode: "tell" },
  status: { kind: "status", mode: "tell" },
  title: { kind: "title", mode: "tell" },
});

export type DialogMethods = {
  [K in keyof typeof DIALOG_TABLE]: (typeof DIALOG_TABLE)[K]["mode"] extends "ask"
    ? (payload?: unknown) => Promise<unknown>
    : (payload?: unknown) => void;
};

/**
 * Close the {@link DIALOG_TABLE} over one {@link DialogBridge} into typed,
 * named convenience methods.
 */
export function makeDialogMethods(bridge: DialogBridge): DialogMethods {
  const methods = {} as Record<string, (payload?: unknown) => unknown>;
  for (const name of Object.keys(DIALOG_TABLE)) {
    const spec = DIALOG_TABLE[name as keyof typeof DIALOG_TABLE];
    if (spec.mode === "ask") {
      methods[name] = (payload?: unknown): Promise<unknown> =>
        bridge.ask(spec.kind, payload, spec.fallback);
    } else {
      methods[name] = (payload?: unknown): void => bridge.tell(spec.kind, payload);
    }
  }
  return methods as DialogMethods;
}