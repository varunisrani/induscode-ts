// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Task capability — delegate a self-contained piece of work to a sub-agent.
 *
 * App-novel wiring. The `task` tool lets the primary agent hand off a bounded
 * objective (e.g. "find every call site of `foo` and summarize them") to a fresh
 * sub-agent that runs its own tool loop and reports back a single result, keeping
 * the parent's context window clean.
 *
 * The actual sub-agent runner is NOT owned by this card — it is a framework /
 * swarm concern injected through {@link DeckContext.framework} under the
 * {@link DELEGATE_HANDLE_KEY} key. When that handle is present the capability
 * delegates to it; when it is absent (tests, headless tooling, a host that has
 * not wired the swarm) the capability degrades gracefully to a clearly-typed
 * stub that reports delegation is unavailable rather than throwing. Either way
 * the card builds a valid {@link Capability} and the deck typechecks and runs.
 *
 * The card produces a framework `AgentTool`; parameters are a TypeBox schema and
 * the prose is original to this deck.
 */
import { type Static } from "@sinclair/typebox";
import type { Capability, CapabilityCard, DeckContext } from "../contract";
/** Key under which a host wires a live delegate runner into the deck context. */
export declare const DELEGATE_HANDLE_KEY: "delegate";
/** A single delegated objective handed to the sub-agent runner. */
export interface DelegateRequest {
    /** Optional named agent profile to run as (e.g. "explorer", "reviewer"). */
    readonly agent?: string;
    /** The self-contained objective the sub-agent should accomplish. */
    readonly objective: string;
    /** Optional extra context the parent wants the sub-agent to start with. */
    readonly context?: string;
}
/** The single result a sub-agent reports back to the parent. */
export interface DelegateResult {
    /** Whether the sub-agent considers the objective met. */
    readonly ok: boolean;
    /** The sub-agent's final report, surfaced to the parent agent verbatim. */
    readonly report: string;
}
/** One line of a sub-agent's live activity stream (for the drill-in view). */
export interface ActivityLine {
    /** What kind of step this is, used to colour it. */
    readonly tone: "reason" | "tool" | "result";
    /** The display text (already shortened to a single line). */
    readonly text: string;
}
/** Live progress a running sub-agent streams back while it works. */
export interface DelegateProgress {
    /** Cumulative tokens the sub-agent has spent so far (input + output). */
    readonly tokens: number;
    /** The sub-agent's recent activity (reasoning + tool steps), newest last. */
    readonly activity: readonly ActivityLine[];
}
/**
 * The contract a host's sub-agent runner must satisfy to be wired in.
 *
 * Intentionally minimal: the deck only needs a way to run one objective under
 * cancellation and get one report back. How the runner spawns the sub-agent
 * (in-process loop, worktree, separate process) is entirely the host's concern.
 */
export interface DelegateRunner {
    /** Optional roster of named agent profiles, surfaced in the tool description. */
    listAgents?(): readonly string[];
    /**
     * Run one delegated objective and resolve with the sub-agent's report.
     *
     * When an `onProgress` callback is supplied the runner streams live metrics
     * (token spend) as the sub-agent works, so the host can surface them (the
     * background-agents panel). Optional — a runner may ignore it.
     */
    run(request: DelegateRequest, signal?: AbortSignal, onProgress?: (progress: DelegateProgress) => void): Promise<DelegateResult>;
}
declare const TaskParams: import("@sinclair/typebox").TObject<{
    objective: import("@sinclair/typebox").TString;
    agent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    context: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
/** Statically-inferred parameter type the capability's `execute` receives. */
export type TaskParamsType = Static<typeof TaskParams>;
/** Structured detail returned alongside the model-facing content. */
export interface TaskDetails {
    /** True when a delegate runner handled the objective. */
    readonly delegated: boolean;
    /** True when the sub-agent (or stub) considers the objective met. */
    readonly ok: boolean;
    /** The agent profile that ran, if one was named. */
    readonly agent?: string;
    /** Cumulative tokens the sub-agent spent — streamed live on progress updates. */
    readonly tokens?: number;
    /** The sub-agent's recent activity — streamed live for the drill-in view. */
    readonly activity?: readonly ActivityLine[];
}
/**
 * Build the task/delegate capability.
 *
 * If a {@link DelegateRunner} is present on the context it is bound and the tool
 * truly delegates; otherwise the tool builds anyway and returns a typed,
 * non-throwing stub result so the deck stays assemblable in every environment.
 *
 * @param ctx the deck context; an optional delegate runner is read from
 *            `ctx.framework[DELEGATE_HANDLE_KEY]`.
 */
export declare function buildTaskCapability(ctx: DeckContext): Capability<typeof TaskParams, TaskDetails>;
/** Catalog row for the task/delegate capability. */
export declare const taskCard: CapabilityCard;
export {};
