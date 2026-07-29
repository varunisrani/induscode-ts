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
import { Type, type Static } from "@sinclair/typebox";
import { capabilityId, type Capability, type CapabilityCard, type DeckContext } from "../contract.js";

/** Key under which a host wires a live delegate runner into the deck context. */
export const DELEGATE_HANDLE_KEY = "delegate" as const;

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
    run(
        request: DelegateRequest,
        signal?: AbortSignal,
        onProgress?: (progress: DelegateProgress) => void,
    ): Promise<DelegateResult>;
}

const TaskParams = Type.Object(
    {
        objective: Type.String({
            description:
                "A complete, self-contained statement of what the sub-agent should accomplish. Include everything it needs; it does not share your conversation history.",
        }),
        agent: Type.Optional(
            Type.String({
                description:
                    "Optional named sub-agent profile to run as. Omit to use the default profile.",
            }),
        ),
        context: Type.Optional(
            Type.String({
                description:
                    "Optional extra background the sub-agent should start with.",
            }),
        ),
    },
    { additionalProperties: false },
);

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

const STUB_NOTE =
    "Sub-agent delegation is not wired in this environment, so the objective was not run. Wire a DelegateRunner into the deck context to enable it, or perform the work inline with the other tools.";

/** Read the optional DelegateRunner handle from the deck context. */
function readDelegateRunner(ctx: DeckContext): DelegateRunner | undefined {
    const handle = ctx.framework?.[DELEGATE_HANDLE_KEY];
    if (handle && typeof (handle as DelegateRunner).run === "function") {
        return handle as DelegateRunner;
    }
    return undefined;
}

/** Compose the base tool description, appending the available sub-agent profiles. */
function baseDescription(agents: readonly string[]): string {
    const roster =
        agents.length > 0 ? ` Available sub-agent profiles: ${agents.join(", ")}.` : "";
    return (
        "Delegate a focused, self-contained piece of work to a sub-agent that runs its own tool loop and returns a single report. Use this to keep your own context clean when a task is well-scoped \u2014 searching a large codebase, drafting a file, or investigating a question end-to-end. Give a complete `objective`; the sub-agent does not see your conversation." +
        roster
    );
}

/**
 * Build the task/delegate capability.
 *
 * If a {@link DelegateRunner} is present on the context it is bound and the tool
 * truly delegates; otherwise the tool builds anyway and returns a typed,
 * non-throwing stub result so the deck stays assemblable in every environment.
 *
 * @param ctx the deck context; an optional runner is read from
 *            `ctx.framework[DELEGATE_HANDLE_KEY]`.
 */
export function buildTaskCapability(ctx: DeckContext): Capability<typeof TaskParams, TaskDetails> {
    const runner = readDelegateRunner(ctx);
    const agents = runner?.listAgents?.() ?? [];
    return {
        name: "task",
        label: "Delegate task",
        description: baseDescription(agents),
        parameters: TaskParams,
        async execute(_toolCallId, params, signal, onUpdate) {
            if (!runner) {
                return {
                    content: [{ type: "text", text: STUB_NOTE }],
                    details: { delegated: false, ok: false, agent: params.agent },
                    isError: true,
                };
            }
            const result = await runner.run(
                { objective: params.objective, agent: params.agent, context: params.context },
                signal,
                // Stream live token spend as a tool_update so the background-agents panel
                // can show a running token count next to the elapsed clock. The `details`
                // carries the structured `tokens`; the console reads it off the signal.
                (progress) => {
                    onUpdate?.({
                        content: [{ type: "text", text: `${progress.tokens} tokens` }],
                        details: {
                            delegated: true,
                            ok: false,
                            agent: params.agent,
                            tokens: progress.tokens,
                            activity: progress.activity,
                        },
                    });
                },
            );
            return {
                content: [{ type: "text", text: result.report }],
                details: { delegated: true, ok: result.ok, agent: params.agent },
                isError: result.ok ? undefined : true,
            };
        },
    };
}

/** Catalog row for the task/delegate capability. */
export const taskCard: CapabilityCard = {
    id: capabilityId("task"),
    title: "Delegate task",
    summary: "Hand a self-contained objective to a sub-agent and receive one report back.",
    // Erase the precisely-typed builder to the `Capability` card surface (through
    // `unknown`, as TypeBox tools are invariant in their parameter schema).
    build: (ctx) => buildTaskCapability(ctx),
};