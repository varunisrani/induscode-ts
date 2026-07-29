import vm from "node:vm";
import os from "node:os";
import { parseWorkflowScript, type WorkflowMeta } from "./parse.js";

export interface WorkflowAgentActivity {
  tokensIn: number;
  tokensOut: number;
  toolCount: number;
  currentTool?: string;
  lastTool?: string;
}

export interface WorkflowAgentRunOptions {
  label: string;
  phase?: string;
  schema?: unknown;
  instructions?: string;
  model?: string;
  agentType?: string;
  isolation?: "worktree";
  signal?: AbortSignal;
  onActivity?: (metrics: WorkflowAgentActivity) => void;
}

export interface WorkflowAgentRunner {
  run(prompt: string, options: WorkflowAgentRunOptions): Promise<unknown>;
}

export interface AgentOptions {
  label?: string;
  phase?: string;
  schema?: unknown;
  model?: string;
  isolation?: "worktree";
  agentType?: string;
}

export interface WorkflowRunOptions {
  agentRunner: WorkflowAgentRunner;
  args?: unknown;
  cwd?: string;
  concurrency?: number;
  tokenBudget?: number | null;
  signal?: AbortSignal;
  onLog?: (message: string) => void;
  onPhase?: (title: string) => void;
  onAgentStart?: (event: { id: number; label: string; phase?: string; prompt: string }) => void;
  onAgentEnd?: (event: { id: number; label: string; phase?: string; result: unknown }) => void;
  onAgentActivity?: (id: number, metrics: WorkflowAgentActivity) => void;
}

export interface WorkflowRunResult<T = unknown> {
  meta: WorkflowMeta;
  result: T;
  logs: string[];
  phases: string[];
  agentCount: number;
  durationMs: number;
}

export const WORKFLOW_RUNTIME_BUDGET_MS = 1000;

interface EngineState {
  logs: string[];
  phases: string[];
  agentCount: number;
  spent: number;
  currentPhase?: string;
}

export async function runWorkflow<T = unknown>(script: string, options: WorkflowRunOptions): Promise<WorkflowRunResult<T>> {
  const started = Date.now();
  const { meta, body } = parseWorkflowScript(script);
  const state: EngineState = { logs: [], phases: [], agentCount: 0, spent: 0 };
  const { agentRunner } = options;
  if (!agentRunner || typeof agentRunner.run !== "function") {
    throw new TypeError("runWorkflow requires an agentRunner with a run() method");
  }
  const concurrency = Math.max(1, Math.min(options.concurrency ?? Math.max(1, defaultConcurrency() - 2), 16));
  const limiter = createLimiter(concurrency);
  const pendingAgentRuns = new Set<Promise<unknown>>();
  const log = (message: unknown) => {
    const text = String(message);
    state.logs.push(text);
    options.onLog?.(text);
  };
  const phase = (title: unknown) => {
    const text = requireString(title, "phase title");
    state.currentPhase = text;
    if (!state.phases.includes(text)) state.phases.push(text);
    options.onPhase?.(text);
  };
  const budget = Object.freeze({
    total: options.tokenBudget ?? null,
    spent: () => state.spent,
    remaining: () => options.tokenBudget == null ? Infinity : Math.max(0, options.tokenBudget - state.spent),
  });
  const throwIfAborted = () => {
    if (options.signal?.aborted) throw new Error("workflow aborted");
  };
  const agent = async (prompt: unknown, agentOptions: unknown = {}) => {
    throwIfAborted();
    if (budget.total !== null && budget.remaining() <= 0) throw new Error("workflow token budget exhausted");
    const taskPrompt = requireString(prompt, "agent prompt");
    const normalizedOptions = normalizeAgentOptions(agentOptions);
    const assignedPhase = normalizedOptions.phase ?? state.currentPhase;
    const requestedLabel = normalizedOptions.label?.trim();
    const run = limiter(async () => {
      const id = ++state.agentCount;
      const label = requestedLabel || defaultAgentLabel(assignedPhase, id);
      options.onAgentStart?.({ id, label, phase: assignedPhase, prompt: taskPrompt });
      try {
        throwIfAborted();
        const result = await agentRunner.run(taskPrompt, {
          label,
          phase: assignedPhase,
          schema: normalizedOptions.schema,
          model: normalizedOptions.model,
          agentType: normalizedOptions.agentType,
          isolation: normalizedOptions.isolation,
          signal: options.signal,
          instructions: buildAgentInstructions(assignedPhase, normalizedOptions),
          onActivity: options.onAgentActivity ? (metrics) => options.onAgentActivity?.(id, metrics) : undefined,
        });
        throwIfAborted();
        state.spent += estimateTokens(result);
        options.onAgentEnd?.({ id, label, phase: assignedPhase, result });
        return result;
      } catch (error) {
        if (options.signal?.aborted) throw error;
        log(`agent ${label} failed: ${error instanceof Error ? error.message : String(error)}`);
        options.onAgentEnd?.({ id, label, phase: assignedPhase, result: null });
        return null;
      }
    });
    pendingAgentRuns.add(run);
    run.then(() => pendingAgentRuns.delete(run), () => pendingAgentRuns.delete(run));
    return run;
  };
  const parallel = async (thunks: unknown[]) => {
    throwIfAborted();
    if (!Array.isArray(thunks)) throw new TypeError("parallel() expects an array of functions");
    if (thunks.some((thunk) => typeof thunk !== "function")) {
      throw new TypeError("parallel() expects an array of functions, not promises. Wrap each call: () => agent(...)");
    }
    return Promise.all(thunks.map(async (thunk, index) => {
      try {
        return await (thunk as () => unknown)();
      } catch (error) {
        if (options.signal?.aborted) throw error;
        log(`parallel[${index}] failed: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      }
    }));
  };
  const pipeline = async (items: unknown[], ...stages: Array<(value: unknown, item: unknown, index: number) => unknown>) => {
    throwIfAborted();
    if (!Array.isArray(items)) throw new TypeError("pipeline() expects an array as the first argument");
    if (stages.some((stage) => typeof stage !== "function")) {
      throw new TypeError("pipeline() stages must be functions: pipeline(items, item => ..., result => ...)");
    }
    return Promise.all(items.map(async (item, index) => {
      let value = item;
      for (const stage of stages) {
        try {
          throwIfAborted();
          value = await stage(value, item, index);
          throwIfAborted();
        } catch (error) {
          if (options.signal?.aborted) throw error;
          log(`pipeline[${index}] failed: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        }
      }
      return value;
    }));
  };
  const resolvedCwd = options.cwd ?? process.cwd();
  const context = vm.createContext({
    agent,
    parallel,
    pipeline,
    log,
    phase,
    args: options.args,
    cwd: resolvedCwd,
    process: Object.freeze({ cwd: () => resolvedCwd }),
    budget,
    console: Object.freeze({
      log,
      info: log,
      warn: (message: unknown) => log(`[warn] ${String(message)}`),
      error: (message: unknown) => log(`[error] ${String(message)}`),
    }),
    JSON,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Promise,
  });
  const wrapped = `(async () => {\n${body}\n})()`;
  const result = await new vm.Script(wrapped, { filename: `${meta.name || "workflow"}.js` }).runInContext(context);
  await Promise.allSettled([...pendingAgentRuns]);
  assertStructuredCloneable(result, "workflow result");
  return {
    meta,
    result: result as T,
    logs: state.logs,
    phases: state.phases,
    agentCount: state.agentCount,
    durationMs: Date.now() - started,
  };
}

export function defaultConcurrency(): number {
  const count = os.cpus()?.length;
  return typeof count === "number" && count > 0 ? count : 8;
}

export function createLimiter(limit: number): <T>(fn: () => Promise<T>) => Promise<T> {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    active--;
    queue.shift()?.();
  };
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= limit) await new Promise<void>((resolve) => queue.push(resolve));
    active++;
    try {
      return await fn();
    } finally {
      next();
    }
  };
}

export function requireString(value: unknown, name: string): string {
  if (typeof value !== "string") throw new TypeError(`${name} must be a string`);
  return value;
}

export function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  return requireString(value, name);
}

export function normalizeAgentOptions(value: unknown): AgentOptions {
  if (!value || typeof value !== "object") throw new TypeError("agent options must be an object");
  const options = value as Record<string, unknown>;
  return {
    ...options,
    label: optionalString(options.label, "agent label"),
    phase: optionalString(options.phase, "agent phase"),
    model: optionalString(options.model, "agent model"),
    isolation: options.isolation as "worktree" | undefined,
    agentType: optionalString(options.agentType, "agent type"),
  };
}

export function assertStructuredCloneable(value: unknown, name: string): void {
  try {
    structuredClone(value);
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(`${name} must be structured-cloneable; did you forget to await agent(), parallel(), or pipeline()?${detail}`);
  }
}

export function defaultAgentLabel(phase: string | undefined, index: number): string {
  return phase ? `${phase} agent ${index}` : `agent ${index}`;
}

export function buildAgentInstructions(phase: string | undefined, options: AgentOptions): string | undefined {
  const lines: string[] = [];
  if (phase) lines.push(`Workflow phase: ${phase}`);
  if (options.agentType) lines.push(`Act as workflow subagent type: ${options.agentType}`);
  if (options.isolation) lines.push(`Requested isolation: ${options.isolation}`);
  if (options.model) lines.push(`Requested model: ${options.model}`);
  return lines.length ? lines.join("\n") : undefined;
}

export function estimateTokens(value: unknown): number {
  return Math.ceil(JSON.stringify(value ?? "").length / 4);
}

export function conductorFault(message: string): Error {
  return new Error(message);
}
