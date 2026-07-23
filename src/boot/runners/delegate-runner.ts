// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Boot helper: a live {@link DelegateRunner} that makes the `task` tool real.
 *
 * The `task` capability ({@link "../../capability-deck/cards/task-card"}) advertises
 * sub-agent delegation but only *runs* it when a {@link DelegateRunner} is wired
 * into the deck context under {@link DELEGATE_HANDLE_KEY}; absent one it degrades
 * to a typed `STUB_NOTE`. This module supplies that runner.
 *
 * Each delegated objective spins a *fresh, isolated* framework {@link Agent} (the
 * same `facade/bot` Agent the conductor already drives — NOT the swarm `Crew` nor
 * `runtime/createAgent`) bound to the parent's model id and credential resolver,
 * given a survey-style system prompt and a deck that DELIBERATELY excludes the
 * `task` card. That exclusion is the recursion guard: a sub-agent with no `task`
 * tool cannot spawn its own sub-agents. The runner submits one prompt, lets the
 * sub-agent run its own tool loop to completion, then extracts the final
 * assistant turn's text as the single report handed back to the parent.
 *
 * The runner never throws out of `run()`: a model that does not resolve, a
 * sub-agent error, or an empty transcript all map to a `{ ok:false, report }`
 * result so a delegation failure surfaces to the parent agent as an ordinary
 * tool error rather than crashing the turn. Cancellation is forwarded: an
 * already-aborted signal short-circuits, and an abort raised mid-run calls
 * `agent.abort()`.
 *
 * The `spawn`/`tools` options are pure test seams — they let a unit test drive
 * the runner with an in-memory fake instead of a real network round-trip.
 */
import { type AgentMessage, type SessionPermissionPolicy } from "../../conductor";
import { type AgentTool } from "../../capability-deck";
import type { DelegateRunner } from "../../capability-deck/cards/task-card";
/**
 * The minimal sub-agent surface the runner drives.
 *
 * A real framework {@link Agent} satisfies this structurally; a test passes a
 * lightweight fake via {@link DelegateRunnerOptions.spawn}. Only the pieces the
 * runner touches are named — submit a prompt, abort, and read the resulting
 * transcript/error afterward.
 */
export interface DelegateSubAgent {
    prompt(input: string): Promise<void>;
    abort(): void;
    readonly state: {
        messages: readonly AgentMessage[];
        error?: string;
    };
    /**
     * Optional event subscription (the real framework `Agent` provides it). The
     * runner uses it to recompute live token spend as the sub-agent works; a test
     * fake may omit it, in which case no progress is reported.
     */
    subscribe?(listener: () => void): () => void;
}
/** Configuration for {@link createDelegateRunner}. */
export interface DelegateRunnerOptions {
    /** The model id the sub-agent runs under (the parent's resolved model). */
    readonly modelId: string;
    /** The working directory the sub-agent's deck is scoped to. */
    readonly cwd: string;
    /** The system prompt that shapes the sub-agent's behaviour. */
    readonly system: string;
    /**
     * Per-call credential resolver, forwarded to the framework `Agent` unchanged
     * (OAuth-only providers, short-lived token rotation). Omitted from the agent
     * options entirely when undefined so the framework env-var lookup still wins.
     */
    readonly getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
    /**
     * Test seam: build the sub-agent from the objective instead of constructing a
     * real framework `Agent`. When omitted the runner uses `new Agent`.
     */
    readonly spawn?: (objective: string, context?: string) => DelegateSubAgent;
    /**
     * Test seam: the tool deck the sub-agent runs with. When omitted the runner
     * provisions the read-only `'authoring'` profile (which already excludes the
     * `task` card — the recursion guard).
     */
    readonly tools?: () => AgentTool[];
    /**
     * Resolve the current server-tier gateway routing map (provider -> gateway
     * base url). Called FRESH on every `run()` — never cached — so a mid-session
     * `/login` (to "Indus Server"), including one that lands after this runner was
     * constructed but before a given delegated call, is always picked up. This
     * mirrors {@link getApiKey}, which is likewise invoked per-request rather than
     * resolved once at construction.
     */
    readonly getGatewayBaseUrls?: () => Promise<Record<string, string>>;
    /**
     * The parent session's live permission policy: the SAME mutable rule list the
     * parent gate reads plus a live getter onto the conductor's current mode. When
     * present, every spawned sub-agent runs under a RESOLVER-LESS gate built from
     * it — deny/ask rules, plan-mode enforcement, and the catastrophic-bash
     * blocklist apply per inner tool call, and a mid-run mode switch (Shift+Tab)
     * retargets the very next delegated tool call. A sub-agent cannot prompt, so
     * an `ask` decision deterministically denies with an actionable message.
     * Absent (a bare test construction), the sub-agent runs ungated as before.
     */
    readonly permissionPolicy?: SessionPermissionPolicy;
}
/**
 * Build a live {@link DelegateRunner} the host wires into the deck context.
 *
 * The model is resolved once up front; if the id resolves to nothing the runner
 * still builds but every `run()` reports `{ ok:false }` rather than throwing, so
 * a misconfigured model can never crash the parent's turn.
 *
 * @param opts the model id, cwd, system prompt, and optional credential/test seams
 * @returns a runner satisfying the task card's {@link DelegateRunner} contract
 */
export declare function createDelegateRunner(opts: DelegateRunnerOptions): DelegateRunner;
