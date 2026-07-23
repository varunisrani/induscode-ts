// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Runtime-bridge contract — the FROZEN type surface of provider *routing*.
 *
 * This module is the single typed seam that decides, per model, **where a turn
 * is actually produced**: by the framework's own network stream
 * (`streamSimple` over an HTTP provider) or by an *external runtime* — a child
 * coding-agent process driven over its own protocol (an Anthropic-flavoured CLI
 * speaking line-delimited JSON, an OpenAI-flavoured CLI emitting `--json`
 * items, or a peer agent reachable over JSON-RPC). The product never calls a
 * bridge or the framework stream directly; it asks the {@link RuntimeBroker} to
 * route, and the broker picks the path.
 *
 * Design stance:
 *   - A model is *annotated*, not re-catalogued. The model catalog/matcher
 *     (Phase 2) own the {@link Model} list; this layer only attaches an optional
 *     {@link ExternalRuntimeSpec} that says "this model is backed by a spawned
 *     CLI / a peer agent, here is how to reach it and authenticate". A model
 *     with no spec routes normally.
 *   - Every external runtime speaks a *different* wire dialect, but the broker
 *     should not care. So each bridge is reduced to a **parser** that yields a
 *     provider-neutral {@link NormalizedEvent} stream, and the single
 *     {@link BridgeEventSink} translates those events into the framework's
 *     {@link AssistantMessageEventStream} push shape. The imperative
 *     `pushStart/pushTextDelta/pushDone` idiom lives in exactly one place.
 *   - The child process / RPC peer a bridge drives is reached through an
 *     **injectable** {@link ChildTransport}, never a hard-coded `spawn`. Tests
 *     hand the bridge a fake transport so no real `claude`/`codex` binary is
 *     launched.
 *   - Authentication policy is data, not control flow:
 *     {@link RuntimeBridge.requiresCredential} answers "does this model need a
 *     key on disk before it can be offered?" — a spawned-CLI runtime that owns
 *     its own auth returns `false`, letting the model appear available with no
 *     key.
 *
 * Framework anchors (all from the sibling rebuilt framework, the `indusagi`
 * package) — consumed verbatim, never re-derived:
 *   - `Model`, `Context`, `AssistantMessage`, `AssistantMessageEventStream`,
 *     `Api`, `StopReason`, `ToolCall`, `Usage`, `SimpleStreamOptions`,
 *     `KnownProvider` ← `indusagi/ai`
 *   - `streamSimple` is the network fallback the broker routes to.
 *
 * Interface-dictated shapes preserved as-is:
 *   - the `bridge:<adapter>` synthetic endpoint convention for runtime-backed
 *     models (so a catalog entry has a stable, non-HTTP `baseUrl`);
 *   - the external CLI protocol vocabularies (Anthropic stream-json content
 *     blocks, OpenAI `--json` items, peer JSON-RPC requests) — surfaced only as
 *     the opaque payloads a {@link ChildTransport} carries, never re-expressed.
 */
import type { Api, AssistantMessage, AssistantMessageEventStream, Context, KnownProvider, Model, SimpleStreamOptions, StopReason, ToolCall } from "indusagi/ai";
/** Re-exported framework vocabulary routing consumers routinely compose. */
export type { Api, AssistantMessage, AssistantMessageEventStream, Context, KnownProvider, Model, SimpleStreamOptions, StopReason, ToolCall, };
/**
 * The set of bridge adapters this layer ships.
 *
 * Each value names a concrete {@link RuntimeBridge} implementation and the wire
 * dialect it speaks:
 *   - `"claude-cli"`     — drives an Anthropic-flavoured CLI emitting
 *                          line-delimited stream-json content blocks.
 *   - `"codex-cli"`      — drives an OpenAI-flavoured CLI emitting `--json`
 *                          turn/item events.
 *   - `"indusagi-cli"`   — drives a peer agent over JSON-RPC; the child already
 *                          speaks the framework event vocabulary, so its events
 *                          map onto {@link NormalizedEvent} near-directly.
 *
 * Left open (`(string & {})`) so an extension can register a further adapter
 * without editing this union, while the three shipped ids keep autocompletion.
 */
export type RuntimeAdapterId = "claude-cli" | "codex-cli" | "indusagi-cli" | (string & {});
/**
 * How a model bound to an external runtime authenticates.
 *
 *   - `"external-cli"` — the spawned child owns its own auth (its own login /
 *     keychain); the product needs **no** key on disk, so the model can be
 *     offered as available with an empty vault. This is the policy that makes a
 *     CLI-backed model "just work" once the underlying tool is logged in.
 *   - `"api-key"` — the runtime still needs an API key resolved from the
 *     credential vault, same as a normal HTTP provider; only the *transport*
 *     differs.
 */
export type RuntimeAuthMode = "external-cli" | "api-key";
/**
 * The annotation that turns an ordinary {@link Model} into an external-runtime
 * model. Attached alongside a catalog card (it is *additive* metadata — the
 * catalog/matcher are unaware of it) and consulted by the {@link RuntimeBroker}
 * to decide routing.
 *
 * All transport fields are optional: a bridge may have a sensible default
 * binary, take no extra args, inherit the parent environment, and route to its
 * own downstream source. Only {@link adapter} is required, because it selects
 * which {@link RuntimeBridge} owns the exchange.
 */
export interface ExternalRuntimeSpec {
    /** Which bridge owns this model's exchange (the {@link RuntimeBridge.adapter}). */
    readonly adapter: RuntimeAdapterId;
    /** Whether the runtime needs a key on disk, or owns its own auth. */
    readonly authMode: RuntimeAuthMode;
    /** Override for the child executable to launch (defaults to the bridge's own). */
    readonly binaryPath?: string;
    /** Extra command-line arguments prepended to the bridge's protocol flags. */
    readonly args?: readonly string[];
    /** Environment overrides merged into the child process environment. */
    readonly env?: Readonly<Record<string, string>>;
    /**
     * For a bridge that fronts another source (e.g. a peer agent that itself
     * talks to a downstream provider), the provider slug the child should target.
     * Ignored by bridges that terminate the exchange themselves.
     */
    readonly delegate?: string;
}
/**
 * The synthetic endpoint scheme stamped onto a runtime-backed model's
 * `baseUrl`. A model annotated with {@link ExternalRuntimeSpec} carries
 * `baseUrl === "${RUNTIME_ENDPOINT_SCHEME}${adapter}"` so it has a stable,
 * non-HTTP address that never resolves to a network host.
 */
export declare const RUNTIME_ENDPOINT_SCHEME: "bridge:";
/** The literal type of {@link RUNTIME_ENDPOINT_SCHEME}. */
export type RuntimeEndpointScheme = typeof RUNTIME_ENDPOINT_SCHEME;
/**
 * Compose the synthetic `bridge:<adapter>` endpoint for a runtime-backed model.
 * Inert string helper; the single sanctioned way to mint the convention so it
 * stays uniform across the catalog annotation and the broker's routing check.
 *
 * @param adapter the {@link RuntimeBridge.adapter} owning the model
 */
export declare function runtimeEndpoint(adapter: RuntimeAdapterId): string;
/**
 * A provider-neutral streamed event — the common currency between a bridge's
 * per-dialect parser and the {@link BridgeEventSink}.
 *
 * Each external runtime emits its own wire vocabulary (Anthropic content
 * blocks, OpenAI items, peer JSON-RPC events). A bridge's only job is to map
 * that vocabulary onto this small, closed union; the sink then translates a
 * {@link NormalizedEvent} into the matching framework
 * {@link AssistantMessageEventStream} push call. This is the seam that removes
 * the per-bridge `stream.push*` duplication.
 *
 * Variants:
 *   - `text`     — a chunk of assistant answer text.
 *   - `thinking` — a chunk of reasoning text (runtimes without a thinking
 *                  channel simply never emit this).
 *   - `tool_call`— a fully-formed tool invocation the child decided on.
 *   - `resume`   — the child reported a session/thread id the bridge can persist
 *                  to reattach the underlying CLI session after a restart.
 *   - `finish`   — the exchange settled successfully with a terminal reason.
 *   - `failed`   — the exchange ended in error.
 */
export type NormalizedEvent = {
    readonly kind: "text";
    readonly delta: string;
} | {
    readonly kind: "thinking";
    readonly delta: string;
} | {
    readonly kind: "tool_call";
    readonly call: ToolCall;
} | {
    readonly kind: "resume";
    readonly resumeToken: string;
} | {
    readonly kind: "finish";
    readonly reason: FinishReason;
} | {
    readonly kind: "failed";
    readonly error: BridgeFailure;
};
/** The discriminant literals of {@link NormalizedEvent}, for filtering/logging. */
export type NormalizedEventKind = NormalizedEvent["kind"];
/** Extract a single member of {@link NormalizedEvent} by its `kind`. */
export type NormalizedEventOf<K extends NormalizedEventKind> = Extract<NormalizedEvent, {
    kind: K;
}>;
/**
 * The terminal reasons an external exchange can settle on. A subset of the
 * framework's {@link StopReason} — the non-error outcomes a bridge reports to
 * the sink, which then emits the framework `done` event.
 */
export type FinishReason = Extract<StopReason, "stop" | "length" | "toolUse">;
/**
 * A typed failure surfaced by a bridge when an external exchange breaks. The
 * `aborted` flag distinguishes a caller-cancelled exchange (the child was
 * interrupted) from a genuine fault, so the sink can emit the matching
 * framework error reason (`aborted` vs `error`).
 */
export interface BridgeFailure {
    /** Human-readable, single-line summary of what went wrong. */
    readonly message: string;
    /** True when the exchange was cancelled rather than failing on its own. */
    readonly aborted?: boolean;
    /** Underlying error or structured detail, if any. */
    readonly cause?: unknown;
}
/**
 * The single push-stream helper every bridge writes through.
 *
 * It owns the accumulating {@link AssistantMessage}, the content-block index
 * bookkeeping, and the lazily-started lifecycle (the first emission opens the
 * stream). A bridge never touches {@link AssistantMessageEventStream} directly;
 * it constructs a sink, drives it with normalized events, and returns the
 * sink's {@link stream}. This centralizes the
 * `ensureStarted → push* → finishSuccess/finishError` idiom so the per-bridge
 * code is purely a parser.
 *
 * The convenience methods cover the common path; {@link emit} accepts a raw
 * {@link NormalizedEvent} for parsers that prefer to yield the union directly.
 */
export interface BridgeEventSink {
    /**
     * Open the underlying stream and push the framework `start` event, if it has
     * not already started. Idempotent: safe to call before any emission, and a
     * no-op once started. The convenience emitters call it implicitly.
     */
    start(): void;
    /** Append a chunk of assistant answer text (opens a text block on first call). */
    text(delta: string): void;
    /** Append a chunk of reasoning text (opens a thinking block on first call). */
    thinking(delta: string): void;
    /** Emit a fully-formed tool call as its own content block. */
    toolCall(call: ToolCall): void;
    /**
     * Map one {@link NormalizedEvent} onto the matching push call. The single
     * entry point a parser can drive with the raw union; dispatches to
     * {@link text} / {@link thinking} / {@link toolCall} / {@link finishSuccess} /
     * {@link finishError} by `kind`. A `resume` event is informational and does
     * not touch the stream.
     */
    emit(event: NormalizedEvent): void;
    /**
     * Settle the exchange successfully: close any open block, finalize the
     * accumulated message, and push the framework `done` event with `reason`.
     * Terminal — no further emissions are valid after this.
     *
     * @param reason the terminal stop reason (defaults to `"stop"`)
     */
    finishSuccess(reason?: FinishReason): void;
    /**
     * Settle the exchange in error: push the framework `error` event. The
     * {@link BridgeFailure.aborted} flag selects the framework error reason
     * (`aborted` vs `error`). Terminal.
     *
     * @param error the typed bridge failure
     */
    finishError(error: BridgeFailure): void;
    /**
     * The framework push stream the broker hands back to its caller. Populated
     * asynchronously as the bridge drives the sink; consumers iterate it exactly
     * as they would the stream `streamSimple` returns.
     */
    readonly stream: AssistantMessageEventStream;
}
/**
 * A single message exchanged with the child runtime over its {@link ChildTransport}.
 *
 * The `payload` is deliberately opaque: it is whatever the underlying protocol
 * carries — a parsed JSON line from a CLI's NDJSON stdout, a JSON-RPC
 * notification from a peer agent, a raw text chunk. The bridge that owns the
 * transport knows how to interpret it; the contract only fixes the envelope so
 * the transport interface itself is dialect-agnostic and mockable.
 */
export interface ChildMessage {
    /** The protocol payload (a parsed JSON value, a text line, an RPC frame). */
    readonly payload: unknown;
}
/**
 * A request sent *to* the child runtime. The bridge formats the dialect-specific
 * body; the transport only relays it. `body` is opaque for the same reason
 * {@link ChildMessage.payload} is.
 */
export interface ChildRequest {
    /** The dialect-specific request body the bridge constructed. */
    readonly body: unknown;
}
/**
 * The injectable boundary between a bridge and the actual child process / RPC
 * peer it drives.
 *
 * A production transport wraps a spawned process (its stdin/stdout, or a
 * JSON-RPC client over that process); a test transport is a hand-written fake
 * that records `send`s and replays canned {@link ChildMessage}s — so a bridge's
 * parser can be exercised with **no real binary launched**. The bridge depends
 * only on this interface, never on `child_process` directly.
 */
export interface ChildTransport {
    /**
     * Relay one {@link ChildRequest} to the child (e.g. write a prompt to stdin or
     * issue a JSON-RPC call). Resolves once the request has been handed off.
     *
     * @param request the dialect-specific request to deliver
     */
    send(request: ChildRequest): Promise<void>;
    /**
     * Register a listener for inbound {@link ChildMessage}s from the child
     * (stdout lines, RPC notifications). Returns an unsubscribe function.
     *
     * @param listener invoked for each inbound message
     * @returns a disposer that removes the listener
     */
    onMessage(listener: (message: ChildMessage) => void): () => void;
    /**
     * Terminate the child and release the transport. Idempotent; safe to call on
     * an already-closed transport. After `close`, `send` rejects and no further
     * messages are delivered.
     */
    close(): Promise<void>;
}
/**
 * Per-exchange options threaded into {@link RuntimeBridge.runExchange} (and the
 * framework `streamSimple` fallback the broker also drives).
 *
 * Extends the framework's {@link SimpleStreamOptions} (so `signal`, `apiKey`,
 * `reasoning`, etc. flow straight through to the network path) with the
 * routing-layer extras a bridge needs:
 *   - {@link sessionId} correlates the exchange with a persisted runtime session
 *     so the bridge can resume the underlying CLI session.
 *   - {@link cwd} is the working directory the child runtime is scoped to.
 *   - {@link resume} carries a previously-persisted token (e.g. a CLI session id
 *     / thread id) the bridge reattaches to instead of starting fresh.
 */
export interface ExchangeOptions extends SimpleStreamOptions {
    /** Stable session id to correlate / persist the runtime session under. */
    readonly sessionId?: string;
    /** Working directory the child runtime is scoped to (defaults to process cwd). */
    readonly cwd?: string;
    /** A resume token from a prior exchange to reattach the underlying session. */
    readonly resume?: string;
}
/**
 * One external-runtime adapter: the strategy that produces a turn for a model
 * whose {@link ExternalRuntimeSpec} names it.
 *
 * A bridge is the dialect specialist. Given the bound {@link Model}, the
 * {@link Context}, per-exchange {@link ExchangeOptions}, and an **injected**
 * {@link ChildTransport}, it drives the child and returns the framework push
 * stream the turn streams into. The transport is a parameter (not constructed
 * internally) precisely so tests pass a fake and no real CLI is spawned.
 *
 * Bridges hold no per-session state on the contract surface; live session
 * handles and reuse/persistence are the {@link RuntimeBroker}'s concern.
 */
export interface RuntimeBridge {
    /** The adapter id this bridge answers to (matched against {@link ExternalRuntimeSpec.adapter}). */
    readonly adapter: RuntimeAdapterId;
    /**
     * Drive one exchange against the external runtime and return the framework
     * push stream it streams into. Returns the stream **synchronously** (the
     * stream is populated asynchronously as the child emits), matching the shape
     * of the framework's own `streamSimple`. The implementation reads inbound
     * {@link ChildMessage}s off `transport`, parses them into
     * {@link NormalizedEvent}s, and feeds a {@link BridgeEventSink}.
     *
     * @param model     the bound framework model for this exchange
     * @param context   the framework conversation context
     * @param opts      per-exchange options (session id, cwd, resume, stream opts)
     * @param transport the injected child boundary to drive
     */
    runExchange(model: Model<Api>, context: Context, opts: ExchangeOptions, transport: ChildTransport): AssistantMessageEventStream;
    /**
     * Whether a model bound to this bridge needs a credential on disk before it
     * can be offered. Returns `false` for an `"external-cli"` spec whose child
     * owns its own auth (so the model is available with an empty vault), `true`
     * for an `"api-key"` spec. The central auth-routing predicate.
     *
     * @param spec the external-runtime annotation to evaluate
     */
    requiresCredential(spec: ExternalRuntimeSpec): boolean;
}
/**
 * The outcome of a routing decision: either an external runtime owns the
 * exchange, or it falls through to the framework network stream.
 *
 *   - `"external"` carries the chosen {@link RuntimeBridge} and the resolved
 *     {@link ExternalRuntimeSpec} the broker will drive `runExchange` with.
 *   - `"framework"` signals the caller to run the framework `streamSimple` path
 *     unchanged.
 */
export type RuntimeRoute = {
    readonly target: "external";
    readonly bridge: RuntimeBridge;
    readonly spec: ExternalRuntimeSpec;
} | {
    readonly target: "framework";
};
/**
 * The router and registry over {@link RuntimeBridge}s — the single decision
 * point for "external runtime vs framework stream".
 *
 * The broker is asked to {@link route} every turn. If the model carries an
 * {@link ExternalRuntimeSpec} whose adapter resolves to a registered bridge,
 * the broker returns an `"external"` route the caller drives via the bridge's
 * `runExchange`; otherwise it returns a `"framework"` route and the caller runs
 * `streamSimple`. Bridges are {@link register}ed at assembly time and looked up
 * by adapter id.
 */
export interface RuntimeBroker {
    /**
     * Add a {@link RuntimeBridge} to the registry, keyed by its
     * {@link RuntimeBridge.adapter}. Registering an adapter id that already exists
     * replaces the prior bridge.
     *
     * @param bridge the bridge to register
     */
    register(bridge: RuntimeBridge): void;
    /**
     * Decide how to produce a turn for `model`. Resolves the model's
     * {@link ExternalRuntimeSpec} (via {@link resolveSpec}) and a matching
     * registered bridge; returns an `"external"` route when both are present and
     * the bridge's credential requirement is satisfiable, else a `"framework"`
     * route. The framework `context`/`opts` are accepted so an implementation may
     * factor them into routing, even though the base decision keys on the model.
     *
     * @param model   the model the turn is bound to
     * @param context the framework conversation context for the turn
     * @param opts    per-exchange options
     */
    route(model: Model<Api>, context: Context, opts: ExchangeOptions): RuntimeRoute;
    /**
     * Resolve the {@link ExternalRuntimeSpec} annotated onto a model, or
     * `undefined` when the model is a plain HTTP-provider model. How the spec is
     * attached (a side-table keyed by canonical id, a field on a catalog card, a
     * `bridge:<adapter>` baseUrl decode) is the implementation's choice; the
     * contract only fixes the lookup.
     *
     * @param model the model to inspect for a runtime annotation
     */
    resolveSpec(model: Model<Api>): ExternalRuntimeSpec | undefined;
    /**
     * Whether a runtime-annotated model needs a credential on disk before it can
     * be offered as available. Delegates to the owning bridge's
     * {@link RuntimeBridge.requiresCredential}; returns `false` for a model with
     * no spec only when the caller treats "no runtime" as "framework auth applies
     * elsewhere" — so this answers strictly the *runtime* credential question.
     *
     * @param spec the runtime annotation to evaluate
     */
    requiresCredential(spec: ExternalRuntimeSpec): boolean;
}
