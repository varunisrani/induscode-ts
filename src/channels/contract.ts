// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Channels contract — the FROZEN type surface of Phase 8 (non-interactive
 * drivers).
 *
 * A *channel* is a way to talk to a {@link SessionConductor} from outside the
 * interactive terminal. Two channels share this contract:
 *
 *   - the **oneshot** channel runs a single request to settlement and writes the
 *     result to a stream (clean text, or a streamed NDJSON event log);
 *   - the **link** channel is a long-lived, bidirectional JSON-RPC 2.0 server
 *     plus a typed driver (client) that drives a child process over NDJSON.
 *
 * This module declares *only* shapes and a handful of inert, pure helpers — no
 * I/O, no process plumbing, no dispatch. The server, the driver, the framer, and
 * the oneshot runner are each written against the names declared here, so the
 * file is intentionally small, append-mostly, and stable.
 *
 * Design stance:
 *   - The protocol is **one declarative operation registry**, not a
 *     hand-written dispatch ladder mirrored by hand-written client methods. An
 *     {@link Op} pairs a wire `method` name with a typed `handle`; an
 *     {@link OpRegistry} (the result of {@link defineOps}) is consumed by *both*
 *     the server (data-driven dispatch) and the {@link LinkDriver} (a generated
 *     client whose method set is derived from the same registry).
 *   - The wire envelope is **JSON-RPC 2.0**: a request carries `{ id?, method,
 *     params }`, a reply carries `{ id, result }` or `{ id, error }`. The
 *     {@link Reply} / {@link OpError} types pin that envelope.
 *   - Framing is **NDJSON**, one JSON value per line. The framer
 *     ({@link encodeLine} / {@link decodeLines}) is correct by construction: it
 *     escapes the two line separators (U+2028, U+2029) that are valid inside a
 *     JSON string but break a naive line splitter, and it pulls lines with an
 *     async generator rather than an event callback.
 *   - The transport is **injectable**. A {@link ChannelContext} carries the
 *     conductor plus the streams and the dialog primitives, so tests drive the
 *     channels over in-memory pipes with no real stdio.
 *
 * Conductor anchor: {@link SessionConductor} and its {@link ConductorState} come
 * from the sibling Phase-2 conductor contract; the channels never re-declare
 * them, they compose them.
 */
import type { ImageContent } from "indusagi/ai";
import type { ConductorState, SessionConductor, ThinkingLevel, Usage } from "../conductor/contract";
/** Re-exported anchors that channel consumers routinely need. */
export type { ImageContent, SessionConductor, ConductorState, ThinkingLevel, Usage };
/** The protocol version literal stamped on every framed envelope. */
export declare const PROTOCOL_VERSION: "2.0";
/** The literal type of {@link PROTOCOL_VERSION}. */
export type ProtocolVersion = typeof PROTOCOL_VERSION;
/**
 * The id correlating a request to its reply.
 *
 * A request with an id expects exactly one reply bearing the same id; a request
 * without an id is a notification and is never replied to. Numeric ids are
 * accepted on the wire but the driver mints string ids.
 */
export type RequestId = string | number;
/**
 * A request frame: a single operation invocation.
 *
 * `method` selects the {@link Op} by its wire name; `params` carries its typed
 * payload (absent when the op takes none). When `id` is present the sender
 * expects a correlated {@link Reply}; when it is absent the request is a
 * fire-and-forget notification.
 */
export interface OpRequest<P = unknown> {
    /** Envelope version; always {@link PROTOCOL_VERSION}. */
    readonly jsonrpc: ProtocolVersion;
    /** Correlation id, or absent for a notification. */
    readonly id?: RequestId;
    /** Wire name of the operation to invoke. */
    readonly method: string;
    /** Operation payload, when the operation takes one. */
    readonly params?: P;
}
/**
 * A typed error returned by a failed operation.
 *
 * The `code` is a small integer category (negative values follow the JSON-RPC
 * reserved ranges); `message` is a single-line human summary; the optional
 * `data` carries structured detail for logging without parsing the message.
 */
export interface OpError {
    /** Numeric error category. */
    readonly code: number;
    /** Human-readable, single-line summary. */
    readonly message: string;
    /** Optional structured detail. */
    readonly data?: unknown;
}
/** A successful reply: the correlated result for one request. */
export interface ReplyOk<R = unknown> {
    /** Envelope version; always {@link PROTOCOL_VERSION}. */
    readonly jsonrpc: ProtocolVersion;
    /** The id of the request this reply settles. */
    readonly id: RequestId;
    /** The operation result payload. */
    readonly result: R;
}
/** A failed reply: the correlated error for one request. */
export interface ReplyErr {
    /** Envelope version; always {@link PROTOCOL_VERSION}. */
    readonly jsonrpc: ProtocolVersion;
    /** The id of the request this reply settles. */
    readonly id: RequestId;
    /** The typed failure. */
    readonly error: OpError;
}
/**
 * The reply envelope: either a result or an error, correlated by id.
 *
 * Discriminate by presence of the `result` / `error` key (see
 * {@link isReplyOk}). This is the only shape the driver waits on for a pending
 * request and the only shape the server emits in response to a request frame.
 */
export type Reply<R = unknown> = ReplyOk<R> | ReplyErr;
/** Narrow a {@link Reply} to its success arm. */
export declare function isReplyOk<R>(reply: Reply<R>): reply is ReplyOk<R>;
/** The closed set of error codes the channels mint. */
export declare const OP_ERROR: Readonly<{
    /** The framed line was not valid JSON. */
    parse: -32700;
    /** The frame was not a well-formed request. */
    invalidRequest: -32600;
    /** No operation is registered under the requested `method`. */
    unknownOp: -32601;
    /** The `params` failed the operation schema. */
    invalidParams: -32602;
    /** The operation handler threw. */
    handlerFailed: -32000;
}>;
/**
 * The minimal writable surface a channel emits onto.
 *
 * Pinning the dependency to this one method (rather than a Node `Writable`) is
 * what lets a test capture output into an array while production passes the real
 * `process.stdout`. The optional `cb` mirrors Node so a caller can await drain.
 */
export interface WritableLine {
    /** Write one already-framed chunk; the optional callback fires when flushed. */
    write(chunk: string, cb?: (error?: Error | null) => void): boolean;
}
/**
 * The minimal readable surface a channel consumes.
 *
 * An async-iterable of string or byte chunks — exactly what `process.stdin` and
 * an in-memory pipe both satisfy. The framer turns this chunk stream into a line
 * stream; nothing else reads it directly.
 */
export type ReadableChunks = AsyncIterable<string | Uint8Array>;
/**
 * Encode one value as a single NDJSON line.
 *
 * Serializes `value` to JSON and appends a newline. Crucially it escapes the two
 * Unicode line separators U+2028 and U+2029 to their `
` / `
` forms:
 * both are legal *inside* a JSON string but a downstream splitter that treats
 * them as line boundaries would corrupt the frame. Escaping them keeps the
 * framing strictly newline-delimited regardless of payload content.
 *
 * @param value any JSON-serializable value (a request, a reply, or a signal)
 * @returns the encoded line, terminated by a single `\n`
 */
export type EncodeLine = (value: unknown) => string;
/**
 * Decode a chunk stream into a stream of parsed JSON values.
 *
 * An async generator (pull model): it buffers incoming chunks, splits strictly
 * on `\n`, parses each complete line, and yields the parsed value. Partial
 * trailing data is held until its newline arrives; a blank line is skipped. It
 * never splits on U+2028/U+2029, so a value encoded by {@link EncodeLine}
 * round-trips exactly.
 *
 * @param stream the raw chunk stream (e.g. stdin or an in-memory pipe)
 */
export type DecodeLines = (stream: ReadableChunks) => AsyncGenerator<unknown, void, unknown>;
/**
 * The NDJSON framer pair: the two halves of the line transport.
 *
 * Bundled so the server, the driver, and the oneshot channel all share one
 * correct implementation rather than re-deriving framing at each call site.
 */
export interface NdjsonFramer {
    /** Serialize one value to a newline-terminated, separator-safe line. */
    readonly encodeLine: EncodeLine;
    /** Pull parsed values from a chunk stream, one per `\n`. */
    readonly decodeLines: DecodeLines;
}
/**
 * A blocking request from the agent to whoever is driving the channel.
 *
 * `ask` is the round-trip dialog primitive: the server emits an `Ask` frame and
 * suspends until a matching answer arrives (or the deadline lapses). The `kind`
 * names the interaction (a choice, a confirm, a free-text prompt, an editor
 * session); `payload` carries the kind-specific options; the `id` correlates the
 * eventual answer.
 */
export interface Ask {
    /** Frame discriminant on the wire. */
    readonly type: "ask";
    /** Correlation id for the answer. */
    readonly id: string;
    /** The interaction kind (e.g. `"select"`, `"confirm"`, `"input"`, `"editor"`). */
    readonly kind: string;
    /** Kind-specific options for the interaction. */
    readonly payload?: unknown;
}
/** The answer to an {@link Ask}, correlated by its `id`. */
export interface AskAnswer {
    /** Frame discriminant on the wire. */
    readonly type: "answer";
    /** The id of the {@link Ask} this answers. */
    readonly id: string;
    /** The supplied value (kind-specific; `null` when dismissed). */
    readonly value: unknown;
}
/**
 * A one-way notice from the agent to the driver — no answer expected.
 *
 * `tell` is the fire-and-forget dialog primitive: status updates, a flashed
 * notification, a title change. The `kind` names the notice; `payload` carries
 * its detail.
 */
export interface Tell {
    /** Frame discriminant on the wire. */
    readonly type: "tell";
    /** The notice kind (e.g. `"notify"`, `"status"`, `"title"`). */
    readonly kind: string;
    /** Kind-specific detail. */
    readonly payload?: unknown;
}
/**
 * The dialog seam a channel exposes to the agent/extension layer.
 *
 * One generic round-trip primitive ({@link ask}) plus one fire-and-forget
 * primitive ({@link tell}); every concrete dialog method (select, confirm,
 * input, notify, set-status, …) is expressed in terms of these two, so there is
 * no per-method choreography to repeat.
 */
export interface DialogBridge {
    /**
     * Emit an {@link Ask} and resolve with the matching {@link AskAnswer} value.
     *
     * Resolves with `fallback` if no answer arrives before the deadline, so a
     * disconnected or non-interactive driver never wedges the agent.
     *
     * @param kind     the interaction kind
     * @param payload  kind-specific options
     * @param fallback value to resolve with on timeout / dismissal
     */
    ask<T>(kind: string, payload: unknown, fallback: T): Promise<T>;
    /**
     * Emit a {@link Tell} and return immediately.
     *
     * @param kind    the notice kind
     * @param payload kind-specific detail
     */
    tell(kind: string, payload?: unknown): void;
}
/**
 * The execution context handed to every {@link Op.handle} and shared by both
 * channels.
 *
 * It bundles the {@link SessionConductor} an operation delegates to, the framed
 * transport (`out` to emit, `framer` to encode), and the {@link DialogBridge}
 * for blocking/fire-and-forget interaction. Everything is injected, so a test
 * supplies a fake conductor, an array-backed {@link WritableLine}, and an
 * in-memory dialog bridge with no real process attached.
 */
export interface ChannelContext {
    /** The session this channel drives; every op delegates to it. */
    readonly conductor: SessionConductor;
    /** The framed output sink for replies, signals, and dialog frames. */
    readonly out: WritableLine;
    /** The shared NDJSON framer. */
    readonly framer: NdjsonFramer;
    /** The dialog round-trip / notice bridge. */
    readonly dialog: DialogBridge;
}
/**
 * A single named operation in the link protocol.
 *
 * An op binds a wire `method` name to a typed `handle`: given the request
 * `params` of type `P` and the {@link ChannelContext}, it produces a result of
 * type `R`. The server invokes `handle` on a matching request and frames its
 * resolved value into a {@link Reply}; the {@link LinkDriver} exposes a method of
 * the same name that round-trips `P` to `R`. One declaration drives both halves.
 *
 * @typeParam P the operation's parameter shape (`void` when it takes none)
 * @typeParam R the operation's result shape
 */
export interface Op<P = void, R = unknown> {
    /** The wire method name; the registry key and the driver method name. */
    readonly method: string;
    /**
     * Run the operation against the live session.
     *
     * @param params the validated request payload
     * @param ctx    the shared channel context (conductor, transport, dialog)
     */
    handle(params: P, ctx: ChannelContext): Promise<R>;
}
/**
 * A map of operation name to its {@link Op} declaration — what {@link defineOps}
 * produces and what both the server and the {@link LinkDriver} consume.
 *
 * The map is keyed by the same string used as each op's `method`, so dispatch is
 * a single lookup and the driver's method set is exactly `keyof` this map.
 */
export type OpRegistry = Readonly<Record<string, Op<any, any>>>;
/**
 * Freeze a set of operation declarations into an {@link OpRegistry}.
 *
 * The lone sanctioned way to mint a registry, so the dispatch map and the driver
 * type always derive from one frozen source. Each entry's key becomes the wire
 * method name; the value is the {@link Op}. The result is frozen so neither half
 * can mutate the protocol at runtime.
 *
 * @param ops a record of method-name → {@link Op}
 * @returns the frozen registry, with the input record's exact key/value types
 *          preserved for the generated driver
 */
export declare function defineOps<T extends Record<string, Op<any, any>>>(ops: T): Readonly<T>;
/** Extract the parameter type of an {@link Op}. */
export type OpParams<O> = O extends Op<infer P, any> ? P : never;
/** Extract the result type of an {@link Op}. */
export type OpResult<O> = O extends Op<any, infer R> ? R : never;
/**
 * The generated client type: one method per operation in a registry.
 *
 * For every op `k` in `Ops`, the driver exposes `k(params): Promise<result>` —
 * with the parameter dropped entirely when the op takes `void`. The concrete
 * driver builds these methods from the registry (a proxy / generated thunks), so
 * there are no hand-written parallel method bodies; this type is the static face
 * the registry projects.
 *
 * @typeParam Ops the {@link OpRegistry} the driver is generated from
 */
export type LinkDriver<Ops extends OpRegistry> = {
    [K in keyof Ops]: OpParams<Ops[K]> extends void ? () => Promise<OpResult<Ops[K]>> : (params: OpParams<Ops[K]>) => Promise<OpResult<Ops[K]>>;
};
/**
 * The session-state projection sent over the link.
 *
 * A flat, serializable snapshot of everything a driver needs to mirror the
 * session without holding a live conductor: which model is bound, the reasoning
 * effort, the busy flags, the persisted location, and the queue depth. It is the
 * link's own vocabulary — derived from the conductor's {@link ConductorState}
 * but shaped for the wire, not a passthrough of the internal state object.
 */
export interface LinkSnapshot {
    /** Canonical id of the model currently bound to the session. */
    readonly model: string;
    /** Active reasoning effort. */
    readonly thinking: ThinkingLevel;
    /** Whether an assistant turn is producing output right now. */
    readonly streaming: boolean;
    /** Whether the transcript is being condensed right now. */
    readonly condensing: boolean;
    /** Whether the session has faulted on its most recent turn. */
    readonly faulted: boolean;
    /** Stable identifier of the active session. */
    readonly sessionId: string;
    /** On-disk transcript file backing the session, when persisted. */
    readonly sessionFile?: string;
    /** Whether auto-condense is engaged. */
    readonly autoCondense: boolean;
    /** Number of nodes on the active transcript branch. */
    readonly messageCount: number;
    /** Number of inputs queued behind the in-flight turn. */
    readonly queuedCount: number;
    /** Cumulative token/cost spend across the session so far. */
    readonly usage: Usage;
}
/**
 * An uncorrelated event frame streamed from server to driver.
 *
 * Distinct from a {@link Reply} (which answers a specific request): a signal is
 * pushed as the turn progresses and carries no `id`. The driver fans signals out
 * to its listeners; the oneshot NDJSON shape writes them straight to the sink.
 */
export interface Signal {
    /** Frame discriminant on the wire. */
    readonly type: "signal";
    /** The signal name (the conductor signal kind, projected to the wire). */
    readonly name: string;
    /** The signal's payload. */
    readonly body: unknown;
}
/** The two output shapes the oneshot channel can produce. */
export type OneshotShape = "text" | "ndjson";
/**
 * The request the oneshot channel runs.
 *
 * One or more prompts run sequentially to settlement; `images` ride along with
 * the first. `shape` selects between clean final text and a streamed NDJSON
 * event log.
 */
export interface OneshotRequest {
    /** Output shape: clean final text, or a streamed NDJSON event log. */
    readonly shape: OneshotShape;
    /** The prompts to run, in order. */
    readonly prompts: readonly string[];
    /** Images attached to the first prompt, if any. */
    readonly images?: readonly ImageContent[];
}
/**
 * A pluggable per-shape strategy for the oneshot channel.
 *
 * Each shape ({@link OneshotShape}) supplies one of these: `onStart` runs once
 * before the prompts (e.g. emit a header line for NDJSON), `onSignal` reacts to
 * each conductor signal (NDJSON emits; text ignores), and `finish` turns the
 * settled state into the process exit code (0 ok, 1 on fault). Selecting a shape
 * is choosing a strategy object — there are no shape branches sprinkled through
 * the runner body.
 */
export interface OneshotStrategy {
    /** Run once before any prompt is submitted. */
    onStart?(ctx: ChannelContext): void | Promise<void>;
    /** React to one streamed signal as the turn progresses. */
    onSignal?(signal: unknown, ctx: ChannelContext): void;
    /**
     * Produce the exit code from the settled state once all prompts resolve.
     *
     * @param state the conductor state after the final prompt
     * @param ctx   the channel context
     */
    finish(state: ConductorState, ctx: ChannelContext): number | Promise<number>;
}
/** The request-id prefix the driver stamps on outgoing requests. */
export declare const REQUEST_ID_PREFIX: "lnk-";
/**
 * Timeouts and intervals the channels need, sourced from config rather than
 * hard-coded at the call sites.
 *
 * Every duration is in milliseconds. Defaults are supplied by
 * {@link DEFAULT_CHANNEL_TIMINGS}; an embedder may override any of them when it
 * constructs a driver or server.
 */
export interface ChannelTimings {
    /** How long to wait for a spawned child to report ready before failing. */
    readonly startupMs: number;
    /** Grace period after a soft terminate before a hard kill. */
    readonly shutdownMs: number;
    /** How long a sent request waits for its {@link Reply} before rejecting. */
    readonly requestMs: number;
    /** How long {@link DialogBridge.ask} waits before resolving with its fallback. */
    readonly dialogMs: number;
}
/**
 * The default {@link ChannelTimings}.
 *
 * Deliberately distinct values, owned here and overridable — not a copied
 * constant set scattered across the runners.
 */
export declare const DEFAULT_CHANNEL_TIMINGS: ChannelTimings;
/**
 * Options for constructing the {@link LinkDriver} concrete client.
 *
 * The transport is injectable (`out`/`in` streams), so a test drives the link
 * over in-memory pipes with no spawned process; `timings` overrides any default
 * duration; `framer` overrides the default NDJSON framer.
 */
export interface DriverOptions {
    /** Sink the driver writes framed requests to (defaults to the child stdin). */
    readonly out?: WritableLine;
    /** Source the driver reads framed replies/signals from (defaults to child stdout). */
    readonly in?: ReadableChunks;
    /** Override any subset of the timings. */
    readonly timings?: Partial<ChannelTimings>;
    /** Override the NDJSON framer. */
    readonly framer?: NdjsonFramer;
}
/**
 * Options for constructing the link {@link Op}-dispatch server.
 *
 * The streams are injectable for the same reason: tests serve the link over an
 * in-memory pipe pair instead of real stdio.
 */
export interface ServerOptions {
    /** Source of framed request lines (defaults to stdin). */
    readonly in?: ReadableChunks;
    /** Sink for framed replies, signals, and dialog frames (defaults to stdout). */
    readonly out?: WritableLine;
    /** Override any subset of the timings. */
    readonly timings?: Partial<ChannelTimings>;
    /** Override the NDJSON framer. */
    readonly framer?: NdjsonFramer;
}
