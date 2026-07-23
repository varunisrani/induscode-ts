// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Link server — the data-driven JSON-RPC 2.0 dispatch loop.
 *
 * The server owns the single reader over the inbound stream. For each framed
 * line it decides what the frame is and routes it: a request frame is dispatched
 * through the {@link OpRegistry} (a map lookup, not a command switch) and its
 * outcome is framed back as a {@link Reply}; an inbound {@link AskAnswer} frame
 * is routed to the {@link DialogBridge} to settle a suspended `ask`. One round of
 * the protocol is `{ id, method, params } -> { id, result | error }`.
 *
 * Everything that touches the outside world is injected: the request source, the
 * reply sink, the framer, and the conductor all arrive through the context and
 * options, so a test serves the link over an in-memory pipe pair with no stdio.
 * The dispatch itself is delegated to {@link dispatch} from the ops module, so
 * the server holds no per-method knowledge.
 */
import { type ChannelTimings, type NdjsonFramer, type OpRegistry, type ReadableChunks, type SessionConductor, type WritableLine } from "../contract";
import { type LinkedDialogBridge } from "./dialog";
/**
 * The injectable transport pair the server reads from and writes to.
 *
 * Named `io` at the call site; bundles the inbound request source and the
 * outbound reply/signal sink so tests pass in-memory pipes and production passes
 * stdin / stdout.
 */
export interface LinkServerIo {
    /** Framed inbound request / answer lines (defaults to stdin). */
    readonly in: ReadableChunks;
    /** Framed outbound reply / signal / dialog sink (defaults to stdout). */
    readonly out: WritableLine;
}
/** Optional overrides for a server: a framer and the timings. */
export interface LinkServerConfig {
    /** Override the NDJSON framer (defaults to the shared one). */
    readonly framer?: NdjsonFramer;
    /** Override any subset of the channel timings. */
    readonly timings?: Partial<ChannelTimings>;
}
/** A running server: a promise that settles when the inbound stream ends. */
export interface LinkServer {
    /** Resolves when the request stream is exhausted and the loop has drained. */
    readonly done: Promise<void>;
    /** The dialog bridge the running server feeds inbound answers to. */
    readonly dialog: LinkedDialogBridge;
}
/**
 * Start a link server over an op registry, a conductor, and an injected
 * transport.
 *
 * Builds the shared {@link ChannelContext} (conductor + framer + the freshly
 * wired {@link DialogBridge}), then consumes the inbound stream with a single
 * `for await` loop. Each frame is classified:
 *
 *   - an answer frame is delivered to the dialog bridge;
 *   - a request frame is dispatched through `registry`; a request carrying an
 *     `id` gets exactly one correlated reply (result or error); a notification
 *     (no `id`) is dispatched for its effect and never replied to;
 *   - any other frame is ignored (a forward-compatible no-op).
 *
 * Parse failures from the framer surface as a thrown error in the loop and are
 * framed as a {@link OP_ERROR.parse} reply with no id (the offending frame had
 * none to correlate).
 *
 * @param registry the frozen {@link OpRegistry} that drives dispatch
 * @param conductor the session every op delegates to
 * @param io        the injected request source + reply sink
 * @param config    optional framer / timing overrides
 * @returns a handle whose `done` resolves when the inbound stream ends
 */
export declare function createLinkServer(registry: OpRegistry, conductor: SessionConductor, io: LinkServerIo, config?: LinkServerConfig): LinkServer;
