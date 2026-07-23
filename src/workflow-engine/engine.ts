// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * runWorkflow — the deterministic workflow orchestration engine.
 *
 * A workflow script is plain JavaScript (parsed by {@link parseWorkflowScript})
 * that orchestrates a fan-out of subagents. The engine evaluates the script's
 * body inside a Node `vm` sandbox seeded with a small, frozen global surface:
 *
 *   - `agent(prompt, opts?)`  — spawn one subagent, awaitable, returns its
 *                               result (string, or the validated `opts.schema`
 *                               object). Runs under a FIFO concurrency limiter.
 *   - `parallel(thunks)`      — run an array of `() => Promise` thunks and wait
 *                               for ALL of them (a barrier); results in input
 *                               order; a failed branch logs and yields `null`.
 *   - `pipeline(items, …st)`  — run each item through the stages sequentially,
 *                               while different items proceed independently
 *                               (NO cross-item barrier); a failed stage logs and
 *                               yields `null` for that item.
 *   - `phase(title)`          — open/activate a named progress group.
 *   - `log(message)`          — append a log line.
 *   - `args`                  — the caller-supplied JSON value.
 *   - `budget`                — `{ total, spent(), remaining() }` token budget.
 *   - `cwd`                   — the working directory string.
 *   - frozen `console`        — routed into `log`.
 *
 * The actual subagent spawn is NOT owned here: the engine delegates each
 * `agent()` call to an injected {@link WorkflowAgentRunner} (stage 2 supplies a
 * real one backed by a fresh framework `Agent`; tests pass an in-memory fake).
 * This is the spawn seam that keeps the engine pure and network-free.
 *
 * Behavioral port of pi-dynamic-workflows' `runWorkflow`
 * (pi-dynamic-workflows/src/workflow.ts): same concurrency cap formula, same
 * FIFO limiter, same pending-run tracking + final `Promise.allSettled`, same
 * per-branch failure-to-null semantics, same budget loop, same abort handling,
 * same structured-clone guard on the result, same default agent labels.
 */
import { type WorkflowMeta } from "./parse";
/**
 * Live activity metrics for one running subagent.
 *
 * Folded by the {@link WorkflowAgentRunner} from the framework `Agent`'s event
 * stream and forwarded — via {@link WorkflowAgentRunOptions.onActivity} → the
 * engine's {@link WorkflowRunOptions.onAgentActivity} — into that agent's row in
 * the live `◆ Workflow:` progress tree.
 */
export interface WorkflowAgentActivity {
    /** Cumulative input tokens spent so far. */
    tokensIn: number;
    /** Cumulative output tokens spent so far. */
    tokensOut: number;
    /** How many tool calls the subagent has started. */
    toolCount: number;
    /** The tool the subagent is running right now, if any. */
    currentTool?: string;
    /** The last tool the subagent finished (when nothing is running). */
    lastTool?: string;
}
/** Options the engine hands a {@link WorkflowAgentRunner} for one subagent. */
export interface WorkflowAgentRunOptions {
    /** The resolved, human-readable label for this subagent run. */
    label: string;
    /** The phase this subagent belongs to, if any. */
    phase?: string;
    /**
     * Optional JSON-Schema / TypeBox schema the subagent's result must satisfy.
     * When present the runner returns the validated object; when absent it returns
     * the subagent's final assistant text as a string. Left as `unknown` so the
     * engine stays decoupled from any particular schema library.
     */
    schema?: unknown;
    /** Extra system guidance the engine derived (phase/model/type/isolation). */
    instructions?: string;
    /** Requested model id, if the script passed `opts.model`. */
    model?: string;
    /** Requested subagent profile/type, if the script passed `opts.agentType`. */
    agentType?: string;
    /** Requested isolation mode, if the script passed `opts.isolation`. */
    isolation?: "worktree";
    /** Abort signal forwarded from the workflow run. */
    signal?: AbortSignal;
    /**
     * Called whenever the subagent's live activity changes (a tool starts/ends or
     * a turn settles with token spend). The runner folds this from the framework
     * `Agent` event stream; the engine forwards it to
     * {@link WorkflowRunOptions.onAgentActivity}. Optional — a test fake may omit it.
     */
    onActivity?: (metrics: WorkflowAgentActivity) => void;
}
/**
 * The minimal contract the engine needs to spawn a subagent.
 *
 * Stage 2 implements this against a fresh, isolated framework `Agent` (the
 * delegate-runner spawn pattern): resolve the model, build the authoring deck,
 * prompt to completion, then read either the structured-output capture or the
 * final assistant text. Tests implement it with an in-memory fake so the engine
 * can be exercised with no network.
 */
export interface WorkflowAgentRunner {
    /**
     * Run one subagent task and resolve with its result.
     *
     * @param prompt the task prompt
     * @param options the resolved run options (label, schema, signal, …)
     * @returns the subagent's result — a string, or the validated schema object
     */
    run(prompt: string, options: WorkflowAgentRunOptions): Promise<unknown>;
}
/** Per-subagent option bag accepted by the in-sandbox `agent()` global. */
export interface AgentOptions {
    /** Short unique label for the run (2-5 words); defaulted when absent. */
    label?: string;
    /** Override the phase this agent is attributed to. */
    phase?: string;
    /** Result schema; when present the agent returns the validated object. */
    schema?: unknown;
    /** Requested model id. */
    model?: string;
    /** Requested isolation mode. */
    isolation?: "worktree";
    /** Requested subagent profile/type. */
    agentType?: string;
}
/** Options for {@link runWorkflow}. */
export interface WorkflowRunOptions {
    /** The injected subagent runner (required to actually spawn). */
    agentRunner: WorkflowAgentRunner;
    /** The JSON value exposed to the script as global `args`. */
    args?: unknown;
    /** The working directory exposed to the script as `cwd`/`process.cwd()`. */
    cwd?: string;
    /** Max concurrent subagents; clamped to `[1, 16]`. */
    concurrency?: number;
    /** Optional token budget; `null`/absent means unbounded. */
    tokenBudget?: number | null;
    /** Abort signal — aborts pending and future subagent spawns. */
    signal?: AbortSignal;
    /** Called for each `log()` / console line. */
    onLog?: (message: string) => void;
    /** Called when a new phase is activated. */
    onPhase?: (title: string) => void;
    /** Called just before a subagent starts. */
    onAgentStart?: (event: {
        id: number;
        label: string;
        phase?: string;
        prompt: string;
    }) => void;
    /** Called when a subagent ends (`result === null` means it failed). */
    onAgentEnd?: (event: {
        id: number;
        label: string;
        phase?: string;
        result: unknown;
    }) => void;
    /**
     * Called whenever a running subagent's live activity changes (tool start/end,
     * settled turn token spend). `id` is the 1-based start-order id that matches
     * the `id` on the corresponding {@link onAgentStart} / {@link onAgentEnd} event.
     */
    onAgentActivity?: (id: number, metrics: WorkflowAgentActivity) => void;
}
/** The structured result of a completed workflow run. */
export interface WorkflowRunResult<T = unknown> {
    /** The validated workflow header. */
    meta: WorkflowMeta;
    /** The script's returned value (structured-clone checked). */
    result: T;
    /** All log lines emitted during the run, in order. */
    logs: string[];
    /** All phases observed during the run, in order. */
    phases: string[];
    /** Total subagents spawned. */
    agentCount: number;
    /** Wall-clock duration of the run. */
    durationMs: number;
}
/**
 * Parse and run a deterministic workflow script to completion.
 *
 * @param script the raw workflow JavaScript (first statement: `export const meta`)
 * @param options the injected runner plus run configuration / callbacks
 * @returns the meta, the script's returned value, and run telemetry
 */
export declare function runWorkflow<T = unknown>(script: string, options: WorkflowRunOptions): Promise<WorkflowRunResult<T>>;
