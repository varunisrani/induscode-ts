// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * SessionConductor — the product-level orchestrator over the framework `Agent`.
 *
 * The framework `Agent` (from `indusagi/agent`) is a raw LLM conversation loop:
 * it streams a fine-grained {@link AgentEvent} surface and owns a flat message
 * list. The {@link SessionConductor} wraps one such agent and turns it into a
 * *coding-agent session*: it drives turns, projects the loop's events down to the
 * stable {@link SessionSignal} stream (via {@link translateAgentEvent} + the
 * {@link SignalHub}), persists every produced message into a branchable
 * {@link TranscriptStore}, retries transient model faults, condenses the
 * transcript when it nears the window, and resolves an immutable
 * {@link ConductorState} per turn.
 *
 * This replaces pi's `AgentSession`, but with a deliberately different internal
 * model (the clean-room divergence):
 *   - **Immutable state reducer.** The conductor never mutates a state object in
 *     place. Each transition runs through {@link reduceState}, which returns a
 *     fresh {@link ConductorState}; `snapshot()` hands out that value.
 *   - **Ordered in-flight tool list.** Live tool calls are tracked as an ordered
 *     array (start appends, end removes), not pi's `Set<string>` of pending ids.
 *   - **Typed discriminated faults.** Failures surface as a {@link ConductorFault}
 *     on a `{ kind: "fault" }` signal — never as a fabricated assistant message
 *     and never as a string sentinel.
 *   - **Pluggable condense seam.** Auto-compaction emits a `{ kind: "compacted" }`
 *     signal and calls an injectable {@link CondenseFn}; the real window-budget
 *     engine lands in Phase 3, so the default here is a no-op.
 *
 * Everything heavy is injectable so tests run with no network and no disk: pass a
 * scripted fake {@link AgentLike} (same submit/subscribe/event surface), an
 * in-memory {@link TranscriptStore}, a {@link SignalHub}, and a {@link ModelMatcher}
 * over a stubbed {@link ModelCatalog}.
 */
import type { AgentEvent, AgentMessage, AgentTool, ThinkingLevel } from "indusagi/agent";
import { type Model, type Usage } from "indusagi/ai";
import { type ConductorFault, type ConductorPhase, type ConductorState, type SessionConductor, type SessionConductorOptions, type SessionHead } from "./contract";
import { ModelMatcher } from "./catalog";
import { SignalHub } from "./signal-hub";
import { TranscriptStore } from "./transcript-store";
import { DiagnosticsEngine, type DiagnosticsConfig } from "./diagnostics";
/**
 * The slice of the framework `Agent` the conductor drives.
 *
 * The real `Agent` from `indusagi/agent` satisfies this structurally; tests pass
 * a scripted fake exposing the same submit/subscribe/event surface with no
 * network. Keeping the dependency to an interface (not the concrete class) is what
 * makes the conductor unit-testable.
 */
export interface AgentLike {
    /** Subscribe to the raw framework event stream; returns an unsubscribe thunk. */
    subscribe(fn: (event: AgentEvent) => void): () => void;
    /** Run one prompt turn to settlement. */
    prompt(input: string): Promise<void>;
    /** Cancel the in-flight turn, if any. */
    abort(): void;
    /** The agent's current state (message list, bound model, streaming flag). */
    readonly state: {
        readonly messages: AgentMessage[];
        readonly model: Model<Model<string>["api"]>;
        readonly isStreaming: boolean;
    };
    /** Replace the agent's message list (used on resume). */
    replaceMessages(messages: AgentMessage[]): void;
    /** Bind a different model for subsequent turns. */
    setModel(model: Model<Model<string>["api"]>): void;
    /** Seed/replace the system prompt. */
    setSystemPrompt(prompt: string): void;
    /** Set the tools available to the loop. */
    setTools(tools: AgentTool[]): void;
    /**
     * Apply a reasoning effort to the loop, when the underlying agent supports it.
     * Optional: a scripted fake may omit it, in which case the conductor stores the
     * level and applies it on the next model bind.
     */
    setThinkingLevel?(level: ThinkingLevel): void;
}
/**
 * Options handed to a {@link CondenseFn} on each invocation.
 *
 * Every field is optional so a scripted/no-op hook can ignore the bag entirely:
 *   - `force`         — a manual `/compact` (fold to the last user turn) vs the
 *                       budget-gated auto path.
 *   - `model`         — the model bound to the live session, forwarded so the
 *                       summarizer can write a *real* digest instead of the
 *                       no-model local stub. Omitted when no model is bound.
 *   - `contextTokens` — the conductor's latest provider-reported context
 *                       occupancy, an optional anchor for the slice planner.
 */
export interface CondenseOpts {
    readonly force?: boolean;
    readonly model?: Model<any>;
    readonly contextTokens?: number;
    /**
     * Cancellation for a manual `/compact`. A hook MAY honor it mid-summarization;
     * the conductor always checks it after the hook returns and discards the
     * result when aborted, so even a hook that ignores the signal cancels cleanly.
     */
    readonly signal?: AbortSignal;
    /**
     * The bound model's credential, resolved through the session's per-call key
     * resolver. Forwarded so the summarizer authenticates exactly like a turn —
     * server-tier sessions have no env-var fallback for this.
     */
    readonly apiKey?: string;
}
/**
 * The pluggable condense hook. Given the active branch's messages (and an options
 * bag), it returns the (smaller) message list to replace it with. The live
 * window-budget engine is wired in `boot/runners/session.ts`; the
 * {@link noopCondense} default is an identity transform that ignores the opts.
 */
export type CondenseFn = (messages: AgentMessage[], opts?: CondenseOpts) => AgentMessage[] | Promise<AgentMessage[]>;
/** The default condense hook: returns the input unchanged (no-op), ignoring opts. */
export declare const noopCondense: CondenseFn;
/** Tuning for the transient-fault auto-retry. */
export interface RetryPolicy {
    /** Maximum retry attempts after the first try (default 2). */
    readonly maxAttempts: number;
    /** Base backoff in ms; doubled per attempt (default 250). */
    readonly baseDelayMs: number;
}
/**
 * Injectable collaborators. Every field is optional; the factory supplies a live
 * default (a real `Agent`, an in-memory `TranscriptStore`, a fresh `SignalHub`, a
 * matcher over the live catalog). Tests override exactly what they need.
 */
export interface ConductorDeps {
    /** The framework agent (or a scripted fake). */
    readonly agent?: AgentLike;
    /** Where the transcript persists. */
    readonly store?: TranscriptStore;
    /** The product-signal fan-out. */
    readonly hub?: SignalHub;
    /** Resolves model ids/patterns to catalog cards. */
    readonly matcher?: ModelMatcher;
    /** The condense hook used by the auto-compaction seam. */
    readonly condense?: CondenseFn;
    /** Auto-retry tuning. */
    readonly retry?: RetryPolicy;
    /**
     * Legacy branch-length condense threshold. The auto path is now token-gated
     * ({@link isOverBudget}), so this field is accepted but no longer governs when
     * auto-compaction fires; kept for back-compat with callers that pass it.
     */
    readonly compactAt?: number;
    /** Sleep primitive (injected so tests don't actually wait). */
    readonly sleep?: (ms: number) => Promise<void>;
    /**
     * Post-edit live-diagnostics control. Pass a ready {@link DiagnosticsEngine} to
     * inject one directly (tests), a {@link DiagnosticsConfig} to tune the default
     * engine, or omit it to get the default: ON when `workspace` has a
     * `tsconfig.json` (eslint runner added when an eslint config is present),
     * otherwise inert. Set `{ enabled: false }` to opt out entirely.
     */
    readonly diagnostics?: DiagnosticsEngine | DiagnosticsConfig;
}
/** The transitions the reducer understands — fresh vocabulary, all typed. */
type StateAction = {
    readonly type: "phase";
    readonly phase: ConductorPhase;
} | {
    readonly type: "head";
    readonly head: SessionHead;
} | {
    readonly type: "usage";
    readonly usage: Usage;
    readonly contextTokens: number;
} | {
    readonly type: "model";
    readonly modelId: string;
} | {
    readonly type: "fault";
    readonly fault: ConductorFault;
} | {
    readonly type: "settled";
};
/**
 * Pure transition over {@link ConductorState}. Always returns a brand-new object;
 * the previous state is never mutated. `settled` clears a stale fault and returns
 * to `idle`; `fault` records the fault and flips to `faulted`.
 */
export declare function reduceState(prev: ConductorState, action: StateAction): ConductorState;
/**
 * Construct a {@link SessionConductor}.
 *
 * Resolves (or accepts) every collaborator, then returns the orchestrator:
 *   - **Agent** — `deps.agent` if supplied (the scripted-fake seam tests use),
 *     else a live framework `Agent` bound to the model `options.modelId` resolves
 *     to via the {@link ModelMatcher} over the {@link ModelCatalog}.
 *   - **Store** — `deps.store` if supplied, else a fresh in-memory
 *     {@link TranscriptStore} for a new session id.
 *   - **Hub / matcher / condense / retry** — defaulted from `deps` or fresh.
 *
 * The conductor's public verbs (`submit`, `subscribe`, `abort`, `snapshot`,
 * `resume`, `cycleModel`) all read against this assembly.
 *
 * @param options session configuration (`modelId` required; system/tools/thinking/
 *                workspace/autoCompact optional)
 * @param deps    injectable collaborators; all optional, live defaults supplied
 */
export declare function createSessionConductor(options: SessionConductorOptions, deps?: ConductorDeps): SessionConductor;
/**
 * Return the framework model unchanged, or — when a gateway base URL is set
 * ("server mode") — a CLONE with its `baseUrl` swapped to the gateway so the
 * request flows through the quota-enforcing indus-server. Never mutates the
 * shared catalog card (always spreads into a fresh object). When
 * `gatewayBaseUrl` is `undefined` the model is returned by reference, keeping
 * the local-key path byte-for-byte unchanged.
 */
export declare function withGatewayBaseUrl<M extends {
    baseUrl: string;
    provider: string;
}>(model: M, gatewayBaseUrls: Record<string, string> | undefined): M;
export {};
