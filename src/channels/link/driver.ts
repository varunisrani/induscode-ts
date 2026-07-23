// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Link driver — the generated client over the JSON-RPC link.
 *
 * The driver is the mirror of the server: it writes framed requests and reads
 * framed replies. Crucially it is *generated*, not hand-written — there is no
 * per-op client method. A {@link Proxy} turns any property access into a thunk
 * that frames `{ id, method, params } -> awaits { id, result | error }`, so the
 * driver satisfies the {@link LinkDriver} type projected from a registry with a
 * single body. Adding an op to the registry adds a callable method to the driver
 * for free.
 *
 * The driver owns the single reader over the inbound stream. Every decoded frame
 * is one of: a correlated {@link Reply} (settles the pending request under its
 * id), an uncorrelated {@link Signal} (fanned out to subscribers), or an
 * {@link Ask} (handed to an answerer that posts an {@link AskAnswer} back). One
 * reader, three routes — no competing consumers of the transport.
 */
import { type Ask, type ChannelTimings, type LinkDriver, type NdjsonFramer, type OpError, type OpRegistry, type ReadableChunks, type Signal, type WritableLine } from "../contract";
/** The injectable transport pair the driver writes to and reads from. */
export interface LinkDriverIo {
    /** Sink the driver writes framed requests to (defaults to the child stdin). */
    readonly out: WritableLine;
    /** Source the driver reads framed replies / signals from (defaults to child stdout). */
    readonly in: ReadableChunks;
}
/** Optional overrides for a driver: a framer, the timings, and hooks. */
export interface LinkDriverConfig {
    /** Override the NDJSON framer (defaults to the shared one). */
    readonly framer?: NdjsonFramer;
    /** Override any subset of the channel timings. */
    readonly timings?: Partial<ChannelTimings>;
    /** Invoked for every uncorrelated {@link Signal} the server streams. */
    readonly onSignal?: (signal: Signal) => void;
    /**
     * Invoked when the server asks a question; returns the answer value. When
     * omitted the driver dismisses every ask (posts `null`), so a non-interactive
     * driver never wedges the server.
     */
    readonly onAsk?: (ask: Ask) => unknown | Promise<unknown>;
}
/** A failed reply turned into a throwable error that carries the wire code. */
export declare class LinkRequestError extends Error {
    /** The JSON-RPC error code from the {@link OpError}. */
    readonly code: number;
    /** The structured detail, when the server supplied any. */
    readonly data: unknown;
    constructor(error: OpError);
}
/**
 * A live driver: the generated client plus its lifecycle.
 *
 * `client` is the {@link Proxy} typed as a {@link LinkDriver} for the registry
 * `Ops`; `done` resolves when the inbound stream ends; `close` rejects every
 * still-pending request and stops the reader.
 *
 * @typeParam Ops the {@link OpRegistry} the client type is projected from
 */
export interface LinkDriverHandle<Ops extends OpRegistry> {
    /** The generated, registry-typed client. */
    readonly client: LinkDriver<Ops>;
    /** Resolves when the reader loop drains (the inbound stream ended). */
    readonly done: Promise<void>;
    /** Reject all pending requests with `reason` and stop accepting replies. */
    close(reason?: string): void;
}
/**
 * Build a {@link LinkDriverHandle} over an injected transport.
 *
 * The returned `client` is a {@link Proxy}: reading property `m` yields a thunk
 * `(params?) => Promise<result>` that mints an id (prefixed with
 * {@link REQUEST_ID_PREFIX}), writes the framed request, and resolves when the
 * matching {@link Reply} arrives (or rejects on a {@link ReplyErr} or timeout).
 * No method is hand-written; the registry type parameter only shapes the static
 * face. The reader loop classifies inbound frames into replies, signals, and
 * asks and routes each.
 *
 * @typeParam Ops the registry whose method set types the client
 * @param io     the injected request sink + reply source
 * @param config optional framer / timing / hook overrides
 */
export declare function createLinkDriver<Ops extends OpRegistry = OpRegistry>(io: LinkDriverIo, config?: LinkDriverConfig): LinkDriverHandle<Ops>;
