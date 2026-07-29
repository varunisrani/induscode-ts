/**
 * Oneshot channel — a single non-interactive run to settlement.
 */
import type {
  ChannelContext,
  ConductorState,
  DialogBridge,
  OneshotRequest,
  OneshotShape,
  OneshotStrategy,
} from "./contract.js";

export const inertDialog: DialogBridge = Object.freeze({
  ask<T>(_kind: string, _payload: unknown, fallback: T): Promise<T> {
    return Promise.resolve(fallback);
  },
  tell(_kind: string, _payload?: unknown): void {
    /* no-op */
  },
});

const EXIT_OK = 0;
const EXIT_FAULT = 1;

function exitCodeFor(state: ConductorState): number {
  return state.phase === "faulted" ? EXIT_FAULT : EXIT_OK;
}

function textStrategy(): OneshotStrategy {
  let answer = "";
  return {
    onSignal(signal: unknown): void {
      const s = signal as { kind?: string; delta?: string };
      if (s.kind === "text") {
        answer += s.delta ?? "";
      }
    },
    finish(state: ConductorState, ctx: ChannelContext): number {
      ctx.out.write(answer.endsWith("\n") ? answer : `${answer}\n`);
      return exitCodeFor(state);
    },
  };
}

function ndjsonStrategy(): OneshotStrategy {
  return {
    onStart(ctx: ChannelContext): void {
      ctx.out.write(ctx.framer.encodeLine({ type: "signal", name: "start", body: {} }));
    },
    onSignal(signal: unknown, ctx: ChannelContext): void {
      const s = signal as { kind: string };
      ctx.out.write(ctx.framer.encodeLine({ type: "signal", name: s.kind, body: s }));
    },
    finish(state: ConductorState, ctx: ChannelContext): number {
      ctx.out.write(
        ctx.framer.encodeLine({
          type: "signal",
          name: "end",
          body: { phase: state.phase, usage: state.usage, fault: state.fault },
        }),
      );
      return exitCodeFor(state);
    },
  };
}

const STRATEGIES: Readonly<Record<OneshotShape, () => OneshotStrategy>> = Object.freeze({
  text: textStrategy,
  ndjson: ndjsonStrategy,
});

/**
 * Run one non-interactive request to settlement.
 */
export async function runOneshot(ctx: ChannelContext, opts: OneshotRequest): Promise<number> {
  const strategy = STRATEGIES[opts.shape]();
  const unsubscribe = ctx.conductor.subscribe((signal) => {
    strategy.onSignal?.(signal, ctx);
  });
  try {
    await strategy.onStart?.(ctx);
    let state = ctx.conductor.snapshot();
    for (const prompt of opts.prompts) {
      state = await ctx.conductor.submit(prompt);
    }
    return strategy.finish(state, ctx);
  } finally {
    unsubscribe();
  }
}