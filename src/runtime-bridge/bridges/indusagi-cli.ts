// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * `indusagi-cli` bridge — drives a peer agent over JSON-RPC.
 *
 * Unlike the CLI bridges, the peer already speaks (a transport-framed form of)
 * the framework event vocabulary, so its messages map onto
 * {@link NormalizedEvent} near-directly. Each inbound {@link ChildMessage.payload}
 * is a JSON-RPC frame:
 *   - a **notification** `{ method, params }` streams one turn event:
 *       · `stream/text`        params `{ delta }`       → `text`
 *       · `stream/thinking`    params `{ delta }`       → `thinking`
 *       · `stream/toolCall`    params `{ id, name, arguments }` → `tool_call`
 *       · `session/resume`     params `{ resumeToken }` → `resume`
 *       · `stream/done`        params `{ reason }`      → `finish`
 *       · `stream/error`       params `{ message, aborted }` → `failed`
 *   - a **response** `{ id, result | error }` to the opening `runExchange`
 *     request: an `error` member fails the exchange; a `result` is treated as a
 *     terminal acknowledgement (`finish`) if the stream has not already settled.
 *
 * The opening request is a JSON-RPC `runExchange` call carrying the context,
 * delegate provider, and resume token. The peer is reached only through the
 * injected {@link ChildTransport}; no peer process is spawned here.
 */
import type { ExternalRuntimeSpec, RuntimeBridge } from "../contract";
/**
 * Build the `indusagi-cli` {@link RuntimeBridge}. The bound {@link ExternalRuntimeSpec}
 * is captured so the opening request can forward its `delegate` to the peer; the
 * broker constructs one bridge per spec it routes to.
 *
 * @param spec the runtime annotation whose `delegate` the peer should target
 */
export declare function makeIndusagiCliBridge(spec: ExternalRuntimeSpec): RuntimeBridge;
/**
 * A default `indusagi-cli` bridge bound to a spec with no delegate. Use
 * {@link makeIndusagiCliBridge} when a delegate provider must be forwarded.
 */
export declare const indusagiCliBridge: RuntimeBridge;
