// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Conductor contract — the FROZEN type surface of Phase 2 (agent runtime core).
 *
 * This module is the single typed seam between the coding-agent *product* (the
 * UI/channels that drive a session) and the framework `Agent` (the raw LLM
 * conversation loop, published by `indusagi/agent`). It declares *only* shapes
 * plus two tiny inert helpers — no behavior, no I/O, no orchestration. Every
 * later conductor module (the signal hub, the transcript store, the model
 * catalog/matcher, the credential vault, the conductor factory, and the
 * `SessionConductor` itself) is written against the names declared here, so the
 * file is intentionally small, append-mostly, and stable.
 *
 * Design stance:
 *   - The conductor *wraps* the framework `Agent`. The framework emits a
 *     fine-grained `AgentEvent` stream for its own loop; the conductor consumes
 *     that internally and **re-emits a distinct, product-level
 *     {@link SessionSignal} stream** to consumers. The two are deliberately not
 *     the same union: `SessionSignal` is the stable surface the app renders,
 *     free to evolve independently of the framework's loop events.
 *   - Faults are **typed discriminated values** ({@link ConductorFault}), never
 *     string sentinels. A consumer switches on `fault.kind`, not on substring
 *     matching of a message.
 *   - Persistence uses a **fresh on-disk vocabulary** ({@link TranscriptEntry},
 *     {@link SessionHead}, {@link TRANSCRIPT_SCHEMA}). The node is a `parent`-linked
 *     tree, the version is a namespaced string, and the field names are the
 *     conductor's own — not the framework's session-manager schema.
 *   - State is exposed as an **immutable snapshot** ({@link ConductorState});
 *     consumers read it, they never mutate it.
 *
 * Framework anchors (all from the `indusagi` package — the sibling rebuilt
 * framework this app targets):
 *   - `AgentMessage`, `ThinkingLevel`, `AgentTool` ← `indusagi/agent`
 *   - `Model`, `Usage`, `KnownProvider`           ← `indusagi/ai`
 *
 * The conductor never re-declares these; it composes them.
 */
import type { AgentMessage, AgentTool, CanUseToolFn, ThinkingLevel } from "indusagi/agent";
import type { KnownProvider, Model, Usage } from "indusagi/ai";
import type { PermissionMode } from "../settings.js";
import type { ApprovalResolver } from "./permissions.js";
export type CodingAgentThinkingLevel = ThinkingLevel | "max";
/** Re-exported framework vocabulary that conductor consumers routinely need. */
export type { AgentMessage, AgentTool, CanUseToolFn, ThinkingLevel, Model, Usage, KnownProvider };
/** Re-exported permission vocabulary, so conductor consumers get it in one import. */
export type { PermissionMode, ApprovalResolver };
/**
 * The closed set of failure categories the conductor can surface.
 *
 * Each is a distinct recovery story, so the kind is a discriminant — not a
 * free-form string:
 *   - `model`       — the LLM call itself failed (transport, provider, decode).
 *   - `tool`        — a tool invocation threw or returned a hard error.
 *   - `persistence` — writing/reading the on-disk transcript failed.
 *   - `aborted`     — the caller cancelled the in-flight turn via {@link SessionConductor.abort}.
 *   - `overflow`    — the context window was exceeded and could not be condensed.
 */
export type FaultKind = "model" | "tool" | "persistence" | "aborted" | "overflow";
/**
 * A typed, discriminated failure value emitted on the {@link SessionSignal}
 * stream and attached to faulted states.
 *
 * The `kind` selects the category; `message` is a human-readable summary; the
 * optional `cause` carries the underlying error (or any structured detail) for
 * logging without forcing consumers to parse the message string.
 */
export interface ConductorFault {
    /** Failure category — the discriminant consumers switch on. */
    readonly kind: FaultKind;
    /** Human-readable, single-line summary of what went wrong. */
    readonly message: string;
    /** Underlying error or structured detail, if any. */
    readonly cause?: unknown;
}
/**
 * Construct a {@link ConductorFault}. The single sanctioned way to mint a fault,
 * so the shape stays uniform across every producer.
 *
 * @param kind    the failure category
 * @param message a human-readable, single-line summary
 * @param cause   optional underlying error or structured detail
 */
export function conductorFault(kind: FaultKind, message: string, cause?: unknown): ConductorFault {
  return cause === undefined ? { kind, message } : { kind, message, cause };
}
/**
 * The product-level event stream the conductor emits to its consumers (the
 * interactive UI, the print/JSON mode, the JSON-RPC link).
 *
 * This is the conductor's **re-emitted surface** — distinct from the framework
 * `AgentEvent` union. The conductor subscribes to the raw framework loop,
 * layers persistence / auto-condense / fault handling on top, and projects the
 * result down to this small, stable set of discriminated signals. Consumers
 * switch on `kind` and never see a framework loop event directly.
 *
 *   - `prompt`    — the user's turn was committed to the conversation; `text`
 *                   is the submitted prompt. Emitted the instant the turn is
 *                   accepted (before the model replies) so a UI can echo the
 *                   user message immediately rather than waiting for the first
 *                   assistant token.
 *   - `text`      — a chunk of assistant answer text streamed in.
 *   - `thinking`  — a chunk of reasoning/thinking text streamed in.
 *   - `tool_start`— a tool invocation began (correlate by `id`).
 *   - `tool_update`— a running tool emitted partial progress (correlate by `id`);
 *                   `name` is the tool name and `details` is the tool's own typed
 *                   partial-result detail (e.g. the live `◆ Workflow` snapshot).
 *   - `tool_end`  — a tool invocation finished (`ok` = no error).
 *   - `turn_end`  — the assistant turn settled; `usage` reports token spend.
 *   - `persisted` — the latest node was committed to the transcript (`entryId`).
 *   - `compacted` — the transcript WAS condensed (emitted on completion, not at
 *     the start). `manual` marks a user-driven `/compact` — a view may then
 *     reset its visible transcript — versus mid-turn auto-compaction, where the
 *     display must keep the in-flight exchange on screen.
 *   - `fault`     — a typed {@link ConductorFault} occurred. `transient` marks a
 *     fault surfaced purely as an in-turn notice (e.g. a fallback-model swap on
 *     provider overload) — the turn keeps running, so a consumer must NOT treat
 *     it as the turn's end (must not clear a busy/in-flight indicator on it).
 *   - `queue`     — the pending-input queue changed; `count` is its new depth.
 *   - `idle`      — the conductor has no in-flight work and is ready for input.
 */
export type SessionSignal = { readonly kind: "reset" } | { readonly kind: "phase"; readonly phase: ConductorPhase } | {
    readonly kind: "prompt";
    readonly text: string;
} | {
    readonly kind: "text";
    readonly delta: string;
} | {
    readonly kind: "thinking";
    readonly delta: string;
} | {
    readonly kind: "tool_start";
    readonly id: string;
    readonly name: string;
    readonly args: unknown;
} | {
    readonly kind: "tool_update";
    readonly id: string;
    readonly name: string;
    readonly details: unknown;
} | {
    readonly kind: "tool_end";
    readonly id: string;
    readonly ok: boolean;
    readonly result: unknown;
    readonly isError: boolean;
} | {
    readonly kind: "turn_end";
    readonly usage: Usage;
} | {
    readonly kind: "persisted";
    readonly entryId: string;
} | {
    readonly kind: "compacted";
    readonly manual?: boolean;
} | {
    readonly kind: "fault";
    readonly fault: ConductorFault;
    readonly transient?: boolean;
} | {
    readonly kind: "queue";
    readonly count: number;
} | {
    readonly kind: "idle";
};
/** The discriminant literals of {@link SessionSignal}, for filtering/logging. */
export type SignalKind = SessionSignal["kind"];
/** Extract a single member of {@link SessionSignal} by its `kind`. */
export type SignalOf<K extends SignalKind> = Extract<SessionSignal, {
    kind: K;
}>;
/** A subscriber callback registered with {@link SessionConductor.subscribe}. */
export type SignalHandler = (signal: SessionSignal) => void;
/**
 * The on-disk transcript schema namespace + version.
 *
 * A namespaced string (not a bare integer) so the format is self-describing and
 * can evolve without colliding with any other versioned artifact in the app.
 * This is deliberately the conductor's own vocabulary.
 */
export const TRANSCRIPT_SCHEMA = "indus/transcript@1" as const;
/** The literal type of {@link TRANSCRIPT_SCHEMA}. */
export type TranscriptSchema = typeof TRANSCRIPT_SCHEMA;
/**
 * The conversational role a {@link TranscriptEntry} node carries.
 *
 * Spans both the LLM-facing turns (`user`/`assistant`/`tool`) and the
 * conductor's own bookkeeping nodes (`system` seed, `condense` markers, and
 * `note` for app-injected context). Kept open at the product layer so the
 * transcript can hold more than the framework's message roles.
 */
export type TranscriptRole = "user" | "assistant" | "tool" | "system" | "condense" | "note";
/**
 * A single node in the on-disk transcript tree.
 *
 * The transcript is an append-only **tree**: every node names its `parent`
 * (a root has `parent: null`), and the active leaf is tracked separately in
 * {@link SessionHead}. Branching is moving the head to an earlier node; the next
 * append becomes that node's child. `content` holds the framework
 * {@link AgentMessage} payload so the node round-trips back into the agent loop;
 * `meta` carries optional, non-LLM annotations (labels, condense bookkeeping,
 * model/reasoning markers).
 *
 * Field names are the conductor's own (`parent`, `createdAt`, `meta`) — not the
 * framework's persistence schema.
 */
export interface TranscriptEntry {
    /** Stable unique node id (e.g. a ULID). */
    readonly id: string;
    /** Parent node id, or `null` for the transcript root. */
    readonly parent: string | null;
    /** Conversational role of this node. */
    readonly role: TranscriptRole;
    /** The framework message payload this node persists. */
    readonly content: AgentMessage;
    /** ISO-8601 creation timestamp. */
    readonly createdAt: string;
    /** Optional, non-LLM annotations keyed by name. */
    readonly meta?: Readonly<Record<string, unknown>>;
}
/**
 * The head record of a persisted transcript: which session, and where its
 * active leaf currently points.
 *
 * The `leaf` is the id of the most recently appended (or branched-to) node;
 * walking `parent` links from `leaf` to a root reconstructs the active branch.
 * `null` means an empty transcript (no nodes yet).
 */
export interface SessionHead {
    /** Stable identifier of the session this transcript belongs to. */
    readonly sessionId: string;
    /** Id of the active leaf node, or `null` for an empty transcript. */
    readonly leaf: string | null;
    /**
     * Cumulative session usage (tokens + cost) persisted alongside the head so
     * resume can restore the running total instead of seeding zero. Optional and
     * absent on legacy transcripts; the store rewrites the head line on every
     * flush, keeping this current with the live tally.
     */
    readonly usage?: Usage;
}
/**
 * A lightweight, resolved reference to one model card in the catalog.
 *
 * This is the *display/identity* projection of a framework {@link Model} — the
 * minimum a UI needs to list, label, and select a model without holding the
 * full model object. The matcher produces these; the conductor resolves the
 * chosen one back to a full `Model` when it configures the agent.
 */
export interface ModelCardRef {
    /** Canonical `"provider/modelId"` identifier (the catalog key). */
    readonly id: string;
    /** Owning provider. */
    readonly provider: KnownProvider | string;
    /** Provider-scoped model id (e.g. `"claude-sonnet-4"`). */
    readonly modelId: string;
    /** Human-readable display name. */
    readonly name: string;
    /** Whether this model exposes a reasoning/thinking budget. */
    readonly reasoning: boolean;
}
/**
 * A query against the model catalog/matcher.
 *
 * Resolution is a prioritized candidate pipeline: an explicit `provider`+`modelId`
 * pins a single card; otherwise `pattern` is matched (exact id, `provider/`
 * prefix, then glob/fuzzy) and narrowed by the optional capability filters.
 * All fields are optional so an empty query means "the default candidate".
 */
export interface MatchQuery {
    /** Free-form selector: an id, an alias, or a glob pattern. */
    readonly pattern?: string;
    /** Restrict candidates to this provider. */
    readonly provider?: KnownProvider | string;
    /** Pin a specific provider-scoped model id (used with {@link provider}). */
    readonly modelId?: string;
    /** Require reasoning/thinking support. */
    readonly reasoning?: boolean;
    /** Require image input support. */
    readonly supportsImageInput?: boolean;
}
/**
 * The coarse lifecycle phase of the conductor at a point in time.
 *
 *   - `idle`       — assembled and ready; no turn in flight.
 *   - `streaming`  — an assistant turn is producing text/thinking.
 *   - `tooling`    — a tool invocation is executing mid-turn.
 *   - `condensing` — the transcript is being condensed to fit the window.
 *   - `faulted`    — the last turn ended in a {@link ConductorFault}.
 */
export type ConductorPhase = "idle" | "streaming" | "tooling" | "condensing" | "faulted";
/**
 * An immutable snapshot of the conductor's observable state.
 *
 * Returned by {@link SessionConductor.snapshot} and resolved by
 * {@link SessionConductor.submit}. It is a value, not a live view: every field
 * is read-only and the object reflects the instant it was taken. Re-read with a
 * fresh `snapshot()` to observe later changes.
 */
export interface ConductorState {
    /** Coarse lifecycle phase at snapshot time. */
    readonly phase: ConductorPhase;
    /** The active transcript head (session id + current leaf). */
    readonly head: SessionHead;
    /** Cumulative token/cost spend across the session so far. */
    readonly usage: Usage;
    /**
     * Tokens occupying the model's context window as of the most recent turn —
     * the last assistant turn's reported usage, NOT the cumulative session spend.
     * This is what the footer's `ctx:%` divides by the context window;
     * {@link usage}.totalTokens grows unbounded across turns and would inflate it.
     */
    readonly contextTokens: number;
    /** Canonical id of the model currently bound to the session. */
    readonly modelId: string;
    /** The fault from the most recent turn, when {@link phase} is `"faulted"`. */
    readonly fault?: ConductorFault;
}
/**
 * How a queued input rejoins the conversation once the active turn settles.
 *
 *   - `steer`    — interrupt-style input meant to redirect the agent; drained
 *                  ahead of plain follow-ups.
 *   - `followUp` — input that simply waits its turn after the current one ends.
 *
 * The conductor enqueues input under one of these modes when {@link SessionConductor.submit}
 * is called while a turn is in flight, then drains the queue in order.
 */
export type QueueMode = "steer" | "followUp";
/**
 * One entry in the conductor's pending-input queue: the {@link QueueMode} it was
 * filed under and the raw user `text`. Surfaced by
 * {@link SessionConductor.pendingInputs} so a UI can render what is waiting.
 */
export interface QueuedInput {
    /** How this input will rejoin the conversation when drained. */
    readonly mode: QueueMode;
    /** The raw user message text held for a later turn. */
    readonly text: string;
}
/**
 * A point-in-time tally of the active session: message counts by role, tool
 * activity, cumulative token spend, and total cost. Computed by
 * {@link SessionConductor.stats} from the live message list plus the running
 * usage carried on {@link ConductorState}.
 */
export interface SessionStats {
    /** Identifier of the session these figures describe. */
    readonly sessionId: string;
    /** Number of user-role messages in the active branch. */
    readonly userMessages: number;
    /** Number of assistant-role messages in the active branch. */
    readonly assistantMessages: number;
    /** Number of tool invocations the assistant issued. */
    readonly toolCalls: number;
    /** Number of tool-result messages produced in reply. */
    readonly toolResults: number;
    /** Total message count across all roles. */
    readonly totalMessages: number;
    /** Cumulative token spend, broken out by category and totalled. */
    readonly tokens: {
        readonly input: number;
        readonly output: number;
        readonly cacheRead: number;
        readonly cacheWrite: number;
        readonly total: number;
    };
    /** Cumulative monetary cost of the session so far. */
    readonly cost: number;
}
/** Options for {@link SessionConductor.executeBash}. */
export interface ExecuteBashOptions {
    readonly signal?: AbortSignal;
    /**
     * When `true`, the command's output is *not* recorded as a transcript note,
     * so it never re-enters the agent's context. Defaults to `false`.
     */
    readonly excludeFromContext?: boolean;
}
/** The settled result of {@link SessionConductor.executeBash}. */
export interface BashOutcome {
    /** Combined stdout + stderr of the command. */
    readonly output: string;
    /** Process exit code (`0` on success; non-zero, or `1` on a thrown error). */
    readonly exitCode: number;
}
/**
 * The minimal file-checkpoint surface the conductor drives for rewind (#24).
 *
 * The product mints a concrete `CheckpointStore` (in `boot/runners/checkpoint.ts`),
 * injects it into the deck's `ctx.framework` bag under the `'checkpoint'` key so
 * the framework's write/edit tools record pre-mutation file content against the
 * active transcript node, and ALSO hands it to the conductor as this port. The
 * conductor pins the active node id as its head advances ({@link setActiveNodeId})
 * so a turn's edits key to the node that was active before the turn, and exposes
 * {@link restore}/{@link hasSnapshot} so the tree picker can roll the working tree
 * back when navigating to an earlier node.
 *
 * Declared as a tiny structural port (not the concrete store) so the conductor
 * stays free of any boot-layer import — the product's store satisfies it by shape.
 */
export interface CheckpointPort {
    /**
     * Pin the transcript node subsequent file snapshots are filed under. Called by
     * the conductor as its head advances (at turn start) so a turn's edits key to
     * the node active before the turn ran.
     *
     * @param id the active transcript node id, or `null` to fall back to the root
     */
    setActiveNodeId(id: string | null): void;
    /** Whether a node has ANY recorded file snapshot (the picker's restore gate). */
    hasSnapshot(nodeId: string): boolean;
    /**
     * Roll the working tree back to a node's recorded state, rewriting each tracked
     * file to its pre-mutation content (deleting files recorded as absent). A safe
     * no-op when the node has no snapshot.
     *
     * @param nodeId the transcript node whose file state to restore to
     * @returns the absolute paths that were written or deleted
     */
    restore(nodeId: string): string[];
}
/**
 * Options that configure a {@link SessionConductor} at assembly time.
 *
 * Only {@link modelId} is required; everything else has a sensible default
 * resolved by the conductor factory. The shape is intentionally small — richer
 * wiring (MCP, memory, provider routing) is attached by the factory, not passed
 * through this surface.
 */
export interface SessionConductorOptions {
    /** Canonical id of the model to bind the session to. */
    readonly modelId: string;
    /** Initial system prompt seeding the conversation. */
    readonly system?: string;
    /** Tools made available to the agent for this session. */
    readonly tools?: AgentTool[];
    /** Initial reasoning effort for models that support it. */
    readonly thinking?: CodingAgentThinkingLevel;
    /**
     * Canonical id of a model to fall back to when the bound model is overloaded
     * (HTTP 529 / "overloaded") mid-turn (`--fallback-model`). When set, an
     * overload that exhausts the transient-retry budget swaps to this model once
     * per turn and retries instead of surfacing a terminal fault. Absent disables
     * the swap entirely (behavior-preserving default).
     */
    readonly fallbackModelId?: string;
    /**
     * Per-provider indus-gateway base URLs ("server mode"), keyed by provider slug
     * (e.g. `{ minimax: "http://host/gateway/minimax", sarvam: "…/gateway/sarvam" }`).
     * Set by the session runner for every gateway-eligible provider the user has no
     * local key for but holds a valid server token. At EVERY model bind (including a
     * runtime `/model` switch) the conductor looks up the BOUND model's provider in
     * this map and, when present, binds a CLONE of the framework model with its
     * `baseUrl` swapped to that URL — so any server-tier model routes through the
     * quota-enforcing server while the session token (via {@link getApiKey})
     * authenticates it. A provider absent from the map keeps the direct path.
     */
    readonly gatewayBaseUrls?: Record<string, string>;
    /** Working directory the session is scoped to (defaults to process cwd). */
    readonly workspace?: string;
    /**
     * Directory to persist the transcript into. When set, the conductor backs its
     * {@link TranscriptStore} with a filesystem backend rooted here (one
     * `<sessionId>.ndjson` per session) so the conversation survives the process
     * and can be resumed. Absent (or when a `store` dep is injected) keeps the
     * default in-memory store — nothing is written to disk.
     */
    readonly sessionsDir?: string;
    /** Condense the transcript automatically when it nears the window (default on). */
    readonly autoCompact?: boolean;
    /**
     * Resolve the credential for a provider on each call. Threaded to the framework
     * `Agent`, which calls it per request so short-lived OAuth access tokens (e.g.
     * `openai-codex`) can be refreshed and providers with no env-var mapping still
     * authenticate. Returning `undefined` lets the framework fall back to its own
     * environment lookup. May be sync or async.
     */
    readonly getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
    /**
     * The hard per-tool permission gate, threaded straight to the framework `Agent`.
     * The framework awaits it on the validated arguments immediately before each
     * tool runs and either proceeds (optionally with substituted input) or
     * short-circuits to an `isError` tool result.
     *
     * Supplied as a **factory** `(currentMode, requestApproval?) => CanUseToolFn`:
     * the conductor calls it once with a getter onto its OWN live permission mode,
     * so the gate it returns reads `permissionMode()` live — a
     * {@link SessionConductor.setPermissionMode} retargets later tool calls with no
     * agent rebuild. (A caller that does not care about the live mode can simply
     * ignore the getter and close over a fixed gate.)
     *
     * The OPTIONAL second argument is a stable {@link ApprovalResolver} delegate the
     * conductor owns: it forwards to whatever resolver was installed via
     * {@link SessionConductor.setApprovalResolver} at call time (and denies when none
     * is installed). An interactive front-end can therefore wire its approval overlay
     * AFTER the conductor (and its gate) are built — the factory just closes over the
     * delegate. A factory that ignores it keeps today's behavior.
     *
     * Optional everywhere: omit it and the framework allows every tool (today's
     * allow-all behavior).
     */
    readonly canUseTool?: (currentMode: () => PermissionMode, requestApproval?: ApprovalResolver) => CanUseToolFn;
    /**
     * The permission mode the session opens in. Seeds {@link SessionConductor.permissionMode};
     * defaults to `"default"` when absent. The mode is consulted live by the
     * {@link canUseTool} gate, so a later {@link SessionConductor.setPermissionMode}
     * changes subsequent tool calls without rebuilding the gate.
     */
    readonly permissionMode?: PermissionMode;
    /**
     * Directory the approved plan-mode plan is persisted into. When the model calls
     * `exit_plan_mode` and the user approves leaving plan mode, the conductor writes
     * the plan as a slug-named markdown file under `<plansDir>/plans/`. Absent keeps
     * the handshake (mode flip + context injection) but skips the disk write —
     * tests and headless probes can run the round-trip without a filesystem.
     */
    readonly plansDir?: string;
    /**
     * The per-session file-checkpoint store for rewind (#24), or `undefined` to run
     * without code checkpointing. When present, the conductor pins the active
     * transcript node on it (the head leaf at turn start) so a turn's file edits key
     * to the node that was active before the turn, and {@link SessionConductor.restoreCode}
     * delegates to it so the tree picker can revert the working tree.
     */
    readonly checkpoint?: CheckpointPort;
}
/**
 * What a manual {@link SessionConductor.condense} run amounted to — the honest
 * completion vocabulary `/compact` reports from (see the method doc).
 */
export type CondenseOutcome = "condensed" | "nothing" | "cancelled" | "failed" | "busy";
/**
 * The conductor of a single coding-agent session.
 *
 * It owns the framework `Agent`, threads persistence and auto-condense through
 * the turn loop, and exposes a small product API: submit input, subscribe to
 * the {@link SessionSignal} stream, abort the in-flight turn, read an immutable
 * {@link ConductorState} snapshot, resume a persisted session, and optionally
 * rotate the active model. This is the surface all three run modes drive.
 */
export interface SessionConductor {
    /**
     * Submit user input as a new turn and run the agent to settle.
     *
     * Streams {@link SessionSignal}s to subscribers as the turn progresses and
     * resolves to the immutable {@link ConductorState} once the turn settles
     * (success or fault).
     *
     * When a turn is already in flight the input is **not** dropped: it is handed
     * to {@link enqueue} and run automatically as a later turn once the current one
     * settles. In that case `submit` resolves immediately with the current
     * snapshot rather than waiting for the queued turn.
     *
     * @param input the user message text for this turn
     */
    submit(input: string): Promise<ConductorState>;
    /**
     * Queue an input to run as a future turn. Used directly, or reached via
     * {@link submit} when the conductor is busy. Queued items drain in order after
     * the active turn settles, each running as its own turn. Emits a
     * `{ kind: "queue" }` signal so a UI can reflect the new depth.
     *
     * @param input the user message text to hold for a later turn
     * @param mode  how it rejoins the conversation when drained (default `"followUp"`)
     */
    enqueue(input: string, mode?: QueueMode): void;
    /** How many inputs are currently waiting in the pending-input queue. */
    pendingCount(): number;
    /** A read-only view of the queued inputs, oldest first. */
    pendingInputs(): readonly QueuedInput[];
    /** Discard every queued input. Emits a `{ kind: "queue" }` signal. */
    clearQueue(): void;
    /**
     * Promote the NEWEST queued input to run immediately: the in-flight turn (if
     * any) is aborted — its work stops — while the rest of the queue is kept, and
     * the promoted input runs as the very next turn. The user-facing "run my new
     * message NOW" affordance for a long/stuck turn (issue #19), distinct from
     * {@link abort} (which stops everything and clears the queue). Returns `false`
     * when no input is queued.
     */
    steerNow(): boolean;
    /**
     * Remove and return the text of the most-recently queued input, or `undefined`
     * when the queue is empty. Lets a UI pop the last entry back into its prompt.
     */
    dequeueLast(): string | undefined;
    /**
     * The live transcript messages for the active branch.
     *
     * A read-through onto the wrapped agent's running message list — what the
     * interactive UI renders as the conversation. The returned array is the
     * current contents at call time; re-read to observe later turns.
     */
    messages(): readonly AgentMessage[];
    /**
     * The full framework {@link Model} object currently bound to the session, or
     * `undefined` when none could be resolved. Tracks the active selection across
     * {@link selectModel}/{@link cycleModel} changes.
     */
    model(): Model<any> | undefined;
    /** Whether a turn is currently in flight (guards re-entrant submit). */
    isBusy(): boolean;
    /**
     * The model catalog entries a picker lists, best-first. Derived from the
     * configured model matcher; returns `[]` when no matcher is wired in.
     */
    availableModels(): ModelCardRef[];
    /**
     * Bind a model by canonical id for subsequent turns. The companion of
     * {@link cycleModel}; both route through the same selection path.
     *
     * @param id canonical id of the model to switch to
     */
    selectModel(id: string): void;
    /**
     * Replace the server-tier gateway routing map and immediately re-bind the
     * currently selected model against it (without changing which model is
     * selected). Lets an interactive mid-session sign-in (see `/login` ->
     * "Indus Server") take effect right away: the gateway base-url map is
     * otherwise frozen at conductor construction, so a login that happens after
     * boot would silently never route the bound model through the gateway even
     * though the per-request key resolver already started vending the fresh
     * session token as the provider key.
     *
     * @param map provider id -> gateway base URL, as produced by
     *   `resolveServerGatewayUrls` for the current vault/token state
     */
    updateGatewayBaseUrls(map: Record<string, string>): void;
    /**
     * Replace the agent's tool deck for subsequent turns.
     *
     * Used by `/mcp` to inject the tools of freshly-connected MCP servers into the
     * live session (and to drop them again on disconnect). The conductor merges the
     * passed list with its own seed deck (the built-in tools the session was
     * assembled with), so callers pass only the *extra* tools to add — never the
     * built-ins, which are preserved automatically. Pass `[]` to clear the extras
     * and fall back to the seed deck alone.
     *
     * @param tools the additional tools to layer over the seed deck
     */
    registerTools(tools: AgentTool[]): void;
    /**
     * Manually run the transcript-condense path (`/compact`) and report what
     * happened, so the caller can give honest feedback instead of announcing
     * "condensed" regardless:
     *   - `"condensed"` — the branch shrank and was rebound (emits `compacted`).
     *   - `"nothing"`   — nothing older to fold (single-turn session, or already
     *                     compacted); the transcript is untouched.
     *   - `"cancelled"` — {@link cancelCondense} fired mid-run; the digest was
     *                     discarded and the transcript is untouched.
     *   - `"failed"`    — the condense hook threw; a typed fault was emitted.
     *   - `"busy"`      — a turn is in flight; compact after it settles (or abort
     *                     it first).
     * While the condense runs, {@link submit} queues instead of racing it, and the
     * queue drains once the condense settles.
     */
    condense(instructions?: string): Promise<CondenseOutcome>;
    /**
     * Cancel an in-flight manual {@link condense} (the `/compact` Esc affordance).
     * The summarizer's result is discarded and the transcript stays untouched; a
     * no-op when no manual condense is running.
     */
    cancelCondense(): void;
    /**
     * Branch the transcript from a prior node. A new branch is opened whose parent
     * is `entryId`; the agent's message list is rebound to that branch's root→leaf
     * path. The conductor's head advances onto the chosen node.
     *
     * @param entryId the transcript node to branch from
     */
    fork(entryId: string): Promise<void>;
    /**
     * Move the active leaf to `nodeId`, rebuild that branch's root→leaf path, and
     * rebind the agent's message list to it. Used to walk between existing
     * branches without forking a new one.
     *
     * @param nodeId the transcript node to make the active leaf
     */
    navigateTree(nodeId: string): Promise<void>;
    /**
     * Roll the working tree back to a transcript node's file-checkpoint state
     * (rewind, #24). Reverts every file the node tracked to its pre-mutation content
     * (deleting files that were absent at that point). Additive and code-only: it
     * does NOT move the conversation head — pair it with {@link navigateTree}/{@link fork}
     * for a combined "restore code and conversation". A safe no-op when no checkpoint
     * store is wired or the node has no recorded snapshot.
     *
     * @param nodeId the transcript node whose file state to restore to
     * @returns the absolute paths that were restored (written or deleted)
     */
    restoreCode(nodeId: string): Promise<string[]>;
    /**
     * Whether the tree picker should offer "restore code" for a node — i.e. whether
     * the node has any recorded file-checkpoint snapshot. `false` when no checkpoint
     * store is wired or the node never mutated files, so the picker's restore option
     * is a safe no-op there.
     *
     * @param nodeId the transcript node to test
     */
    codeRestoreInfo(nodeId: string): Promise<{
        readonly canRestore: boolean;
    }>;
    /**
     * Run a shell command in the session workspace, returning its combined
     * stdout+stderr and exit code. Unless `opts.excludeFromContext` is set, the
     * output is recorded as a transcript note so it re-enters the agent's context.
     * Never throws: a spawn/exec failure resolves to a non-zero {@link BashOutcome}.
     *
     * @param command the shell command to execute
     * @param opts    execution options
     */
    executeBash(command: string, opts?: ExecuteBashOptions): Promise<BashOutcome>;
    /** A point-in-time {@link SessionStats} tally for the active session. */
    stats(): SessionStats;
    /**
     * Render the session's cumulative cost + token usage as a human-readable,
     * multi-line report. Drives the `/cost` slash command without the caller
     * having to format the {@link SessionStats} figures itself.
     */
    costReport(): string;
    /** The reasoning effort currently applied to the session. */
    thinkingLevel(): CodingAgentThinkingLevel;
    /**
     * Set the reasoning effort for subsequent turns. Applied to the agent when it
     * exposes a setter; otherwise stored and applied on the next model bind.
     *
     * @param level the reasoning effort to apply
     */
    setThinkingLevel(level: CodingAgentThinkingLevel): void;
    /**
     * Advance the reasoning effort to the next level in the cycle, applying it, and
     * return the newly-selected level.
     */
    cycleThinkingLevel(): CodingAgentThinkingLevel;
    /**
     * The permission mode currently in effect. The live `canUseTool` gate reads
     * this on every tool call, so the value reflects the most recent
     * {@link setPermissionMode}.
     */
    permissionMode(): PermissionMode;
    /**
     * Switch the permission mode for subsequent tool calls. The gate consults the
     * mode live (via a getter), so this takes effect on the next tool call with no
     * agent rebuild. A no-op-equivalent when no gate was wired (the conductor still
     * tracks the mode for the UI).
     *
     * @param mode the permission mode to apply
     */
    setPermissionMode(mode: PermissionMode): void;
    /**
     * Install (or clear) the host approval resolver an `ask` decision routes to.
     *
     * The `canUseTool` gate consults a STABLE delegate the conductor owns; this
     * method swaps the resolver behind that delegate, so an interactive front-end
     * can wire its approval overlay AFTER the conductor (and its gate) are built —
     * the exact post-mount install the React console needs. Passing `undefined`
     * clears it (an `ask` then deterministically denies, the non-interactive
     * default). A no-op-equivalent when no gate was wired; the resolver is simply
     * never consulted.
     *
     * @param resolver the resolver to consult on an `ask`, or `undefined` to clear
     */
    setApprovalResolver(resolver: ApprovalResolver | undefined): void;
    /**
     * Toggle plan mode on or off.
     *
     * Entering plan mode (`true`) captures the current mode as the pre-plan mode and
     * switches to `"plan"` (read-only — the gate blocks every mutating tool).
     * Leaving (`false`) restores the captured pre-plan mode (or `"default"` when none
     * was captured). Idempotent: toggling on while already in plan mode is a no-op,
     * and toggling off when not in plan mode restores/keeps `"default"`. Drives the
     * `/plan` command and the Shift+Tab toggle, and is the same path the conductor's
     * own `enter_plan_mode` / approved `exit_plan_mode` handshake uses.
     *
     * @param on `true` to enter plan mode, `false` to leave it
     * @returns the permission mode in effect after the toggle
     */
    togglePlanMode(on: boolean): PermissionMode;
    /**
     * Advance the permission mode to the NEXT mode in the fixed cycle and return the
     * new mode. The order is `default → acceptEdits → plan → bypass → (wrap)
     * default`; the `"bypassPermissions"` alias is folded to `"bypass"` when reading
     * the current mode so the cycle is stable.
     *
     * Built on top of {@link setPermissionMode}, so the live `canUseTool` gate (which
     * reads {@link permissionMode} on every call) picks the new mode up immediately
     * with no agent rebuild. Plan bookkeeping is preserved: ENTERING `"plan"` captures
     * the pre-plan mode exactly as {@link togglePlanMode} does, so a later round-trip
     * restores the prior mode; LEAVING `"plan"` (cycling `plan → bypass`) is a plain
     * mode change — it does NOT run the `exit_plan_mode` approval handshake, since a
     * manual cycle is not a plan exit. Drives the Shift+Tab cycle; {@link togglePlanMode}
     * remains the path `/plan` uses.
     *
     * @returns the permission mode in effect after the advance
     */
    cyclePermissionMode(): PermissionMode;
    /**
     * The mode captured when plan mode was last entered, restored on exit — or
     * `undefined` when not currently in (or paused from) plan mode. Exposed so a UI
     * (and the round-trip tests) can observe the Enter/Exit pairing.
     */
    prePlanMode(): PermissionMode | undefined;
    /** The human-readable session name, or `undefined` when none is set. */
    sessionName(): string | undefined;
    /**
     * Assign a human-readable name to the session.
     *
     * @param name the display name to store
     */
    setSessionName(name: string): void;
    /**
     * Register a handler for the {@link SessionSignal} stream.
     *
     * @param handler invoked for every emitted signal
     * @returns an unsubscribe function that removes the handler
     */
    subscribe(handler: SignalHandler): () => void;
    /** Cancel the in-flight turn, if any; emits an `aborted` fault signal. */
    abort(): void;
    /** Read an immutable snapshot of the current {@link ConductorState}. */
    snapshot(): ConductorState;
    /**
     * Restore a previously persisted session, replacing the current transcript
     * and rebinding the agent to the restored model/leaf.
     *
     * @param sessionId the persisted session to resume
     */
    resume(sessionId: string): Promise<void>;
    /**
     * Abandon the current conversation and start a fresh, empty session.
     *
     * Drops the agent's message history, opens a new session id (so later turns
     * persist separately, leaving the prior transcript intact on disk), zeroes the
     * usage tally, clears the pending-input queue and session name, and settles to
     * `idle`. Emits an `idle` signal so a subscribed UI re-renders the now-empty
     * conversation. This is what `/clear` (and `/new`) drive.
     */
    newSession(): Promise<void>;
    /**
     * Rotate the active model for subsequent turns. Optional: not every assembly
     * supports mid-session model changes.
     *
     * @param id canonical id of the model to switch to
     */
    cycleModel?(id: string, direction?: -1 | 1): void;
}
