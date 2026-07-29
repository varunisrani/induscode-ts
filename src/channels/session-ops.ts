/**
 * Session ops — the concrete operation registry that drives the link.
 */
import type { ConductorState, LinkSnapshot, Op, ThinkingLevel } from "./contract.js";
import { defineOps } from "./contract.js";

const DEFAULT_THINKING: ThinkingLevel = "off";

export function projectSnapshot(
  state: ConductorState,
  extra: {
    readonly thinking?: ThinkingLevel;
    readonly sessionFile?: string;
    readonly autoCondense?: boolean;
    readonly messageCount?: number;
    readonly queuedCount?: number;
  } = {},
): LinkSnapshot {
  const base: LinkSnapshot = {
    model: state.modelId,
    thinking: extra.thinking ?? DEFAULT_THINKING,
    streaming: state.phase === "streaming" || state.phase === "tooling",
    condensing: state.phase === "condensing",
    faulted: state.phase === "faulted",
    sessionId: state.head.sessionId,
    autoCondense: extra.autoCondense ?? true,
    messageCount: extra.messageCount ?? 0,
    queuedCount: extra.queuedCount ?? 0,
    usage: state.usage,
  };
  return extra.sessionFile === undefined ? base : { ...base, sessionFile: extra.sessionFile };
}

export interface SubmitParams {
  readonly input: string;
}

export interface ResumeParams {
  readonly sessionId: string;
}

export interface CycleModelParams {
  readonly modelId: string;
}

export interface ModelEntry {
  readonly id: string;
  readonly active: boolean;
}

function op<P, R>(method: string, handle: (params: P, ctx: import("./contract.js").ChannelContext) => Promise<R>): Op<P, R> {
  return { method, handle };
}

export const SESSION_OPS = defineOps({
  submit: op("submit", async (params: SubmitParams, ctx) => {
    const state = await ctx.conductor.submit(params.input);
    return projectSnapshot(state);
  }),
  abort: op("abort", async (_params, ctx) => {
    ctx.conductor.abort();
    return projectSnapshot(ctx.conductor.snapshot());
  }),
  snapshot: op("snapshot", async (_params, ctx) => {
    return projectSnapshot(ctx.conductor.snapshot());
  }),
  resume: op("resume", async (params: ResumeParams, ctx) => {
    await ctx.conductor.resume(params.sessionId);
    return projectSnapshot(ctx.conductor.snapshot());
  }),
  listModels: op("listModels", async (_params, ctx) => {
    const active = ctx.conductor.snapshot().modelId;
    return [{ id: active, active: true }];
  }),
  cycleModel: op("cycleModel", async (params: CycleModelParams, ctx) => {
    ctx.conductor.cycleModel?.(params.modelId);
    return projectSnapshot(ctx.conductor.snapshot());
  }),
});

export type SessionOps = typeof SESSION_OPS;