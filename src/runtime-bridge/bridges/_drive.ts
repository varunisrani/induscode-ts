// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Shared exchange driver — the transport-wiring half every bridge reuses.
 *
 * A bridge is meant to be *only* a per-dialect parser. Two concerns are common
 * to all three shipped bridges and are factored here so a bridge never repeats
 * them:
 *
 *   1. The lifecycle wiring: subscribe to the {@link ChildTransport}, forward
 *      each inbound {@link ChildMessage} to the bridge's parser, settle the sink
 *      on a terminal parser result, honour the caller's {@link AbortSignal}, and
 *      always dispose the subscription + transport on the way out.
 *   2. The seed: deriving the {@link BridgeMessageSeed} the sink stamps onto the
 *      accumulated message from the bound {@link Model}.
 *
 * A bridge supplies a {@link ChildParser} (pure: child payload -> parser result)
 * and an opening {@link ChildRequest}; {@link driveExchange} does the rest and
 * returns the populated {@link AssistantMessageEventStream}.
 *
 * Crucially this module touches the transport only through the injected
 * interface — no `child_process`, no `spawn`. A test hands a fake transport and
 * drives the parser end-to-end with zero real binaries.
 */
import type { AssistantMessageEventStream, BridgeEventSink, ChildMessage, ChildRequest, ChildTransport, ExchangeOptions, Model, Api } from "../contract";
import { type BridgeMessageSeed } from "../sink";
/**
 * The outcome a parser reports for one inbound child payload. A parser maps a
 * single {@link ChildMessage} payload to the normalized events it produced and
 * whether that payload terminated the exchange.
 *
 *   - `continue`  — zero or more events were emitted; the stream stays open.
 *   - `done`      — the exchange settled (the parser already emitted the
 *                   `finish` / `failed` event, or the driver should finish with
 *                   the default reason). No further payloads are processed.
 */
export type ParseStep = {
    readonly status: "continue";
} | {
    readonly status: "done";
};
/**
 * A per-dialect parser: interpret one inbound child payload, drive the sink with
 * whatever normalized events it yields, and report whether the exchange is over.
 *
 * The parser owns *interpretation* only; it never touches the framework stream
 * directly — it calls sink methods (`text` / `thinking` / `toolCall` / `emit` /
 * `finishSuccess` / `finishError`). Returning `{ status: "done" }` tells the
 * driver to stop and (if the sink is not already settled) finish successfully.
 */
export type ChildParser = (message: ChildMessage, sink: BridgeEventSink) => ParseStep;
/** Derive the message seed the sink stamps onto its accumulated message. */
export declare function seedFromModel(model: Model<Api>): BridgeMessageSeed;
/**
 * Drive a full exchange over an injected transport.
 *
 * Returns the sink's {@link AssistantMessageEventStream} synchronously; the
 * stream is populated asynchronously as the child emits. The driver:
 *   - subscribes the parser to inbound messages;
 *   - sends the opening request;
 *   - settles + tears down on a terminal parse step, transport closure, abort,
 *     or thrown parser error.
 *
 * @param model     the bound model (seeds the sink identity)
 * @param opts      per-exchange options (only `signal` is consulted here)
 * @param transport the injected child boundary
 * @param request   the opening request to send once subscribed
 * @param parse     the per-dialect parser
 */
export declare function driveExchange(model: Model<Api>, opts: ExchangeOptions, transport: ChildTransport, request: ChildRequest, parse: ChildParser): AssistantMessageEventStream;
/** Best-effort single-line message for an unknown thrown value. */
export declare function errorText(cause: unknown): string;
/** Narrow an opaque payload to a string-keyed record (or `undefined`). */
export declare function asRecord(value: unknown): Record<string, unknown> | undefined;
/** Read a string field off a record, or `undefined` when absent/non-string. */
export declare function strField(record: Record<string, unknown>, key: string): string | undefined;
