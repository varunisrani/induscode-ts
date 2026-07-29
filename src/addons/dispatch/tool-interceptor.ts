/**
 * ToolInterceptor pipeline — the composable tool-call boundary.
 */
import type { AgentToolResult } from "indusagi/agent";
import {
  addonFault,
  type AddonFault,
  type AddonFaultListener,
  type AddonId,
  type EnterOutcome,
  type InterceptResult,
  type InterceptorChain,
  type ToolEnterContext,
  type ToolInterceptor,
} from "../contract.js";

type Execute = (
  args: Readonly<Record<string, unknown>>,
) => Promise<AgentToolResult<unknown>>;

interface EnterVerdict {
  args?: Readonly<Record<string, unknown>>;
  blocked?: { stop: boolean; reason?: string };
}

function isGate(value: unknown): value is { stop: boolean; reason?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "stop" in value &&
    typeof (value as { stop: unknown }).stop === "boolean"
  );
}

function isArgsRewrite(value: unknown): value is { args: Readonly<Record<string, unknown>> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "args" in value &&
    typeof (value as { args: unknown }).args === "object" &&
    (value as { args: unknown }).args !== null
  );
}

function readEnter(outcome: EnterOutcome): EnterVerdict {
  if (outcome === undefined || outcome === null) return {};
  if (isGate(outcome)) {
    return outcome.stop ? { blocked: outcome } : {};
  }
  if (isArgsRewrite(outcome)) {
    return { args: outcome.args };
  }
  return {};
}

function matchesTool(match: string | "*", tool: string): boolean {
  return match === "*" || match === tool;
}

function buildExitContext(
  ctx: ToolEnterContext,
  result: AgentToolResult<unknown> | undefined,
  error: unknown,
): { tool: string; callId: string; result?: AgentToolResult<unknown>; error?: unknown } {
  const base = { tool: ctx.tool, callId: ctx.callId };
  if (error !== undefined) return { ...base, error };
  return result !== undefined ? { ...base, result } : base;
}

export class AddonInterceptorChain implements InterceptorChain {
  private readonly interceptors: readonly ToolInterceptor[];
  private readonly faultListeners: Set<AddonFaultListener>;

  constructor(interceptors: readonly ToolInterceptor[]) {
    this.interceptors = interceptors;
    this.faultListeners = new Set();
  }

  static from(interceptors: readonly ToolInterceptor[]): AddonInterceptorChain {
    return new AddonInterceptorChain(interceptors);
  }

  async run(ctx: ToolEnterContext, execute: Execute): Promise<InterceptResult> {
    const matching = this.interceptors.filter((stage) => matchesTool(stage.match, ctx.tool));
    if (matching.length === 0) {
      return { result: await execute(ctx.args) };
    }
    const entered = await this.applyEnter(ctx, matching);
    if (entered.blocked !== undefined) {
      return { blocked: entered.blocked };
    }
    const execCtx = { ...ctx, args: entered.args ?? ctx.args };
    let result: AgentToolResult<unknown> | undefined;
    let error: unknown;
    try {
      result = await execute(execCtx.args);
    } catch (cause) {
      error = cause;
    }
    const exited = await this.applyExit(execCtx, matching, result, error);
    if (exited !== undefined) {
      return { result: exited };
    }
    if (error !== undefined) {
      throw error;
    }
    return { result };
  }

  matches(tool: string): boolean {
    return this.interceptors.some((stage) => matchesTool(stage.match, tool));
  }

  onFault(listener: AddonFaultListener): () => void {
    this.faultListeners.add(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.faultListeners.delete(listener);
    };
  }

  private async applyEnter(
    ctx: ToolEnterContext,
    stages: readonly ToolInterceptor[],
  ): Promise<EnterVerdict> {
    let args: Readonly<Record<string, unknown>> = ctx.args;
    for (const stage of stages) {
      if (stage.enter === undefined) continue;
      const here = { ...ctx, args };
      let outcome: EnterOutcome | undefined;
      try {
        outcome = await stage.enter(here);
      } catch (cause) {
        this.report(
          addonFault("handler", `Interceptor enter for "${ctx.tool}" threw.`, {
            addon: stage.addon,
            cause,
          }),
        );
        continue;
      }
      const verdict = readEnter(outcome);
      if (verdict.blocked !== undefined) {
        return { args, blocked: verdict.blocked };
      }
      if (verdict.args !== undefined) {
        args = verdict.args;
      }
    }
    return { args };
  }

  private async applyExit(
    ctx: ToolEnterContext,
    stages: readonly ToolInterceptor[],
    result: AgentToolResult<unknown> | undefined,
    error: unknown,
  ): Promise<AgentToolResult<unknown> | undefined> {
    let current = result;
    let rewritten = false;
    for (let i = stages.length - 1; i >= 0; i--) {
      const stage = stages[i];
      if (stage.exit === undefined) continue;
      const exitCtx = buildExitContext(ctx, current, error);
      let outcome: AgentToolResult<unknown> | undefined;
      try {
        outcome = await stage.exit(exitCtx);
      } catch (cause) {
        this.report(
          addonFault("handler", `Interceptor exit for "${ctx.tool}" threw.`, {
            addon: stage.addon,
            cause,
          }),
        );
        continue;
      }
      if (outcome !== undefined) {
        current = outcome;
        rewritten = true;
      }
    }
    return rewritten ? current : undefined;
  }

  private report(fault: AddonFault): void {
    for (const listener of [...this.faultListeners]) {
      try {
        listener(fault);
      } catch {
        /* ignore listener errors */
      }
    }
  }
}

/**
 * Record one tool interceptor, stamping it with the matched tool and owning
 * addon.
 */
export function interceptor(
  addon: AddonId,
  match: string | "*",
  stage: Omit<ToolInterceptor, "match" | "addon">,
): ToolInterceptor {
  return { ...stage, match, addon };
}