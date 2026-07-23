// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * createWorkflowAgentRunner — the live {@link WorkflowAgentRunner} that makes the
 * `workflow` tool's `agent()` global spawn real subagents.
 *
 * The pure {@link "./engine"} engine delegates every `agent(prompt, opts)` call
 * to an injected {@link WorkflowAgentRunner}; this module supplies the production
 * implementation. Each subagent run spins a *fresh, isolated* framework
 * {@link Agent} — the same `facade/bot` Agent the conductor and the `task`
 * delegate-runner drive — bound to the parent's model id and credential
 * resolver, given the `'authoring'` capability deck.
 *
 * Two properties matter:
 *
 *   1. **Recursion guard.** The deck is built via `provisionDeck("authoring", …)`,
 *      whose profile EXCLUDES the app-novel cards — including the new `workflow`
 *      card (registered all-profile-only in {@link "../capability-deck"}). A
 *      workflow subagent therefore cannot itself call `workflow` (nor `task`).
 *
 *   2. **Structured output.** When the script passes `opts.schema`, the runner
 *      adds the {@link createStructuredOutputTool} `structured_output` tool to the
 *      deck and appends the pi "final action MUST be structured_output" contract
 *      to the prompt. Because the framework `AgentToolResult` has no `terminate`
 *      flag, the tool does NOT end the loop early — the runner instead runs the
 *      subagent to completion, then returns `capture.value` (throwing if the
 *      subagent never called it). With no schema it returns the final assistant
 *      text (the {@link finalAssistantText} pattern, identical to delegate-runner).
 *
 * Cancellation is forwarded: an already-aborted signal short-circuits and an
 * abort raised mid-run calls `agent.abort()`.
 *
 * The model catalog/matcher is built ONCE at create time (the conductor pattern);
 * each `run()` resolves the per-call `opts.model` (falling back to the runner's
 * default `modelId`) against that single matcher. The `spawn` option is a pure
 * test seam — a unit test drives the runner with an in-memory fake instead of a
 * real network round-trip.
 */
import { type AgentMessage, type SessionPermissionPolicy } from "../conductor";
import { type AgentTool } from "../capability-deck";
import { type AgentEvent } from "indusagi/agent";
import type { WorkflowAgentRunner } from "./engine";
/**
 * The minimal subagent surface the runner drives.
 *
 * A real framework {@link Agent} satisfies this structurally; a test passes a
 * lightweight fake via {@link WorkflowAgentRunnerOptions.spawn}. Only the pieces
 * the runner touches are named.
 */
export interface WorkflowSubAgent {
    prompt(input: string): Promise<void>;
    abort(): void;
    /**
     * Subscribe to the framework `Agent` event stream; returns an unsubscribe
     * thunk. Optional on the structural fake — when absent the runner simply skips
     * live activity reporting (the run still completes and returns its result).
     */
    subscribe?(fn: (event: AgentEvent) => void): () => void;
    readonly state: {
        messages: readonly AgentMessage[];
        error?: string;
        usage?: unknown;
    };
}
/** The deck of tools handed to a spawned subagent. */
export interface WorkflowSpawnContext {
    /** The base tools for this run (the `'authoring'` deck, recursion-guarded). */
    readonly tools: AgentTool[];
    /** The resolved system prompt for this subagent. */
    readonly systemPrompt: string;
}
/** Configuration for {@link createWorkflowAgentRunner}. */
export interface WorkflowAgentRunnerOptions {
    /** The default model id a subagent runs under when the script names none. */
    readonly modelId: string;
    /** The working directory the subagent's deck is scoped to. */
    readonly cwd: string;
    /**
     * Per-call credential resolver, forwarded to the framework `Agent` unchanged.
     * Omitted from the agent options entirely when undefined so the framework
     * env-var lookup still wins.
     */
    readonly getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
    /**
     * The base system prompt prepended to every subagent. A sensible default is
     * used when omitted.
     */
    readonly system?: string;
    /**
     * Test seam: build the subagent instead of constructing a real framework
     * `Agent`. When omitted the runner uses `new Agent`.
     */
    readonly spawn?: (prompt: string, context: WorkflowSpawnContext) => WorkflowSubAgent;
    /**
     * Resolve the current server-tier gateway routing map (provider -> gateway
     * base url). Called FRESH on every `run()` — never cached — so a mid-session
     * `/login` (to "Indus Server") is always picked up on the very next subagent
     * call. Mirrors {@link getApiKey}, which is likewise invoked per-request
     * rather than resolved once at construction.
     */
    readonly getGatewayBaseUrls?: () => Promise<Record<string, string>>;
    /**
     * The parent session's live permission policy: the SAME mutable rule list the
     * parent gate reads plus a live getter onto the conductor's current mode. When
     * present, every spawned workflow subagent runs under a RESOLVER-LESS gate
     * built from it — deny/ask rules, plan-mode enforcement, and the
     * catastrophic-bash blocklist apply per inner tool call, and a mid-run mode
     * switch (Shift+Tab) retargets the very next subagent tool call. A subagent
     * cannot prompt, so an `ask` decision deterministically denies. Absent (a bare
     * test construction), the subagent runs ungated as before.
     */
    readonly permissionPolicy?: SessionPermissionPolicy;
}
/**
 * Build a live {@link WorkflowAgentRunner} the host wires into the deck context.
 *
 * The model catalog/matcher is built once up front (the conductor pattern); each
 * `run()` resolves `opts.model ?? modelId` against it. A schema request wires the
 * `structured_output` capture tool and the structured contract; a model that does
 * not resolve throws out of `run()` so the engine maps it to an `agent ... failed`
 * log + a `null` branch (the engine's per-branch failure-to-null semantics).
 *
 * @param opts the model id, cwd, credential/system, and optional test seam
 * @returns a runner satisfying the engine's {@link WorkflowAgentRunner} contract
 */
export declare function createWorkflowAgentRunner(opts: WorkflowAgentRunnerOptions): WorkflowAgentRunner;
