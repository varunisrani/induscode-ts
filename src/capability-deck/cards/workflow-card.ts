/**
 * Workflow capability — orchestrate a deterministic fan-out of subagents.
 *
 * App-novel wiring, sibling to (and UNRELATED to) the {@link "./task-card"}
 * delegate card. The `workflow` tool runs a deterministic JavaScript workflow
 * script that calls `agent()`, `parallel()`, and `pipeline()` to fan work out
 * across many fresh subagents and fan their results back in, all under a live
 * `◆ Workflow:` progress tree streamed into the tool result.
 *
 * The actual subagent runner is NOT owned by this card — it is a framework /
 * boot concern injected through {@link DeckContext.framework} under the
 * {@link WORKFLOW_HANDLE_KEY} key. When that handle is present the capability
 * really runs the workflow (via the pure {@link runWorkflow} engine); when it is
 * absent (tests, headless tooling, a host that has not wired the runner) the
 * capability degrades gracefully to a clearly-typed {@link STUB_NOTE} result
 * rather than throwing, exactly like the task card's `readDelegateRunner` path.
 *
 * Recursion guard: this card is registered all-profile-only in
 * {@link "../cards/index"} (`APP_NOVEL_CARDS`), so the `'authoring'` deck a
 * workflow subagent runs against EXCLUDES it — a subagent cannot call `workflow`.
 *
 * Live UI: each engine lifecycle callback mutates a {@link WorkflowSnapshot} and
 * calls the framework `onUpdate` with the snapshot rendered through
 * {@link renderWorkflowText} (the v1 string renderer). Updates are coalesced to
 * status transitions (phase / agent start / agent end), not every log line, to
 * avoid render thrash. The conductor re-projects the framework
 * `tool_execution_update` event to a `tool_update` product signal (stage 3).
 */
import { Type, type Static } from "@sinclair/typebox";
import { capabilityId, type Capability, type CapabilityCard, type DeckContext } from "../contract.js";
import {
    createWorkflowSnapshot,
    preview,
    recomputeWorkflowSnapshot,
    renderWorkflowText,
    runWorkflow,
    type WorkflowSnapshot,
} from "../../workflow-engine";

/** Key under which a host wires a live workflow agent runner into the context. */
export const WORKFLOW_HANDLE_KEY = "workflow" as const;

const WorkflowParams = Type.Object(
    {
        script: Type.String({
            description: [
                "Required raw JavaScript workflow script, with no Markdown fences.",
                "First statement: export const meta = { name: 'short_snake_case', description: 'non-empty description' }.",
                "Use phase(title), agent(prompt, opts), parallel(arrayOfFunctions), pipeline(items, ...stages), log(message), args, and budget. The workflow must call agent() at least once.",
                "parallel() requires functions, not promises: await parallel(items.map(item => () => agent(...))).",
                "Plain JavaScript only \u2014 no imports, require(), fs, Date.now(), Math.random(), or new Date().",
            ].join(" "),
        }),
        args: Type.Optional(
            Type.Any({
                description: "Optional JSON value exposed to the workflow script as global `args`.",
            }),
        ),
    },
    { additionalProperties: false },
);

/** Statically-inferred parameter type the capability's `execute` receives. */
export type WorkflowParamsType = Static<typeof WorkflowParams>;

/** Structured detail returned alongside the model-facing content (the snapshot). */
export type WorkflowDetails = WorkflowSnapshot;

const DESCRIPTION = [
    "Execute a deterministic JavaScript workflow that orchestrates multiple subagents with agent(), parallel(), and pipeline().",
    "Use it for decomposable work \u2014 repository inspection, independent research/checks, multi-perspective review, or fan-out/fan-in synthesis.",
    "script is required raw JavaScript; it must start with `export const meta = { name, description }` and must call agent() at least once.",
].join(" ");

const STUB_NOTE =
    "Workflow orchestration is not wired in this environment, so the script was not run. Wire a WorkflowAgentRunner into the deck context to enable it, or perform the work inline with the other tools.";

/** Read the optional workflow runner handle from the deck context. */
function readWorkflowRunner(ctx: DeckContext) {
    const handle = ctx.framework?.[WORKFLOW_HANDLE_KEY];
    if (handle && typeof (handle as { run?: unknown }).run === "function") {
        return handle;
    }
    return undefined;
}

/** Detect an abort/cancellation error from the workflow engine. */
function isAbortError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return /\babort(?:ed)?\b/i.test(error.message);
}

/**
 * Build the workflow capability.
 *
 * If a workflow runner is present on the context it is bound and the tool
 * truly orchestrates; otherwise the tool builds anyway and returns a typed,
 * non-throwing stub so the deck stays assemblable in every environment.
 *
 * @param ctx the deck context; an optional runner is read from
 *            `ctx.framework[WORKFLOW_HANDLE_KEY]`.
 */
export function buildWorkflowCapability(ctx: DeckContext): Capability<typeof WorkflowParams, WorkflowDetails> {
    const runner = readWorkflowRunner(ctx);
    return {
        name: "workflow",
        label: "Workflow",
        description: DESCRIPTION,
        parameters: WorkflowParams,
        async execute(_toolCallId, params, signal, onUpdate) {
            if (!runner) {
                const stub = createWorkflowSnapshot({ name: "workflow", description: STUB_NOTE });
                return {
                    content: [{ type: "text", text: STUB_NOTE }],
                    details: stub,
                    isError: true,
                };
            }
            let snapshot = createWorkflowSnapshot({
                name: "workflow",
                description: "",
            });
            const emit = (completed = false) => {
                snapshot = recomputeWorkflowSnapshot(snapshot);
                onUpdate?.({
                    content: [{ type: "text", text: renderWorkflowText(snapshot, completed) }],
                    details: snapshot,
                });
            };
            const recordPhase = (title: string) => {
                if (!title) return;
                if (!snapshot.phases.includes(title)) snapshot.phases.push(title);
            };
            const agentById = (id: string) => snapshot.agents.find((item) => item.id === id);
            const ticker = setInterval(() => {
                if (snapshot.agents.some((item) => item.status === "running")) emit();
            }, 1_000);
            if (typeof ticker.unref === "function") ticker.unref();
            try {
                let result;
                try {
                    result = await runWorkflow(params.script, {
                        agentRunner: runner,
                        cwd: ctx.cwd,
                        args: params.args,
                        signal,
                        onLog(message: string) {
                            snapshot.logs.push(message);
                        },
                        onPhase(title: string) {
                            snapshot.currentPhase = title;
                            recordPhase(title);
                            emit();
                        },
                        onAgentStart(event) {
                            recordPhase(event.phase);
                            snapshot.agents.push({
                                id: event.id,
                                label: event.label,
                                phase: event.phase,
                                prompt: event.prompt,
                                status: "running",
                                startedAt: Date.now(),
                            });
                            emit();
                        },
                        onAgentActivity(id: string, metrics) {
                            const agent = agentById(id);
                            if (!agent) return;
                            agent.tokensIn = metrics.tokensIn;
                            agent.tokensOut = metrics.tokensOut;
                            agent.toolCount = metrics.toolCount;
                            agent.currentTool = metrics.currentTool;
                            agent.lastTool = metrics.lastTool;
                        },
                        onAgentEnd(event) {
                            const agent =
                                agentById(event.id) ??
                                [...snapshot.agents]
                                    .reverse()
                                    .find(
                                        (item) => item.label === event.label && item.status === "running",
                                    );
                            if (agent) {
                                agent.status = event.result === null ? "error" : "done";
                                agent.resultPreview = preview(event.result);
                                agent.endedAt = Date.now();
                                agent.currentTool = undefined;
                            }
                            emit();
                        },
                    });
                } catch (error) {
                    if (signal?.aborted || isAbortError(error)) {
                        for (const agent of snapshot.agents) {
                            if (agent.status === "running") {
                                agent.status = "skipped";
                                agent.error = "aborted";
                            }
                        }
                        snapshot = recomputeWorkflowSnapshot(snapshot);
                        emit(true);
                        return {
                            content: [{ type: "text", text: renderWorkflowText(snapshot, true) }],
                            details: snapshot,
                            isError: true,
                        };
                    }
                    const message = error instanceof Error ? error.message : String(error);
                    snapshot = recomputeWorkflowSnapshot(snapshot);
                    return {
                        content: [{ type: "text", text: `Workflow failed: ${message}` }],
                        details: snapshot,
                        isError: true,
                    };
                }
                snapshot.name = result.meta.name;
                snapshot.description = result.meta.description;
                snapshot.result = result.result;
                snapshot.durationMs = result.durationMs;
                snapshot = recomputeWorkflowSnapshot(snapshot);
                emit(true);
                const noAgents = result.agentCount === 0;
                const body = noAgents
                    ? "workflow scripts must call agent() at least once; this workflow declared phases but did not run any subagents"
                    : `Workflow ${result.meta.name} completed with ${result.agentCount} agent(s).\n\n${renderWorkflowText(snapshot, true)}\n\nResult:\n${JSON.stringify(result.result, null, 2)}`;
                return {
                    content: [{ type: "text", text: body }],
                    details: snapshot,
                    isError: noAgents ? true : undefined,
                };
            } finally {
                clearInterval(ticker);
            }
        },
    };
}

/** Catalog row for the workflow capability. */
export const workflowCard: CapabilityCard = {
    id: capabilityId("workflow"),
    title: "Workflow",
    summary: "Run a deterministic JavaScript workflow that fans work out across many subagents.",
    // Erase the precisely-typed builder to the `Capability` card surface (through
    // `unknown`, as TypeBox tools are invariant in their parameter schema).
    build: (ctx) => buildWorkflowCapability(ctx),
};