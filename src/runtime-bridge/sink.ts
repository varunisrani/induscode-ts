// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * The single {@link BridgeEventSink} implementation — the one place the
 * imperative push-stream idiom every bridge shares is written down.
 *
 * Each external runtime emits its own wire dialect; a bridge's parser maps that
 * dialect onto the provider-neutral {@link NormalizedEvent} union and drives a
 * sink. This module owns everything else:
 *
 *   - the accumulating {@link AssistantMessage} `partial` that every framework
 *     event carries (built in-place exactly like the framework's own producers,
 *     so a runtime-backed turn is indistinguishable from a network turn to the
 *     consumer);
 *   - the content-block index bookkeeping (a block's index is its position in
 *     `partial.content`, opened lazily on first emission of its kind);
 *   - the lazily-started lifecycle (`start` is implicit on first emission, and
 *     idempotent) and the terminal `finishSuccess` / `finishError` settle;
 *   - the `NormalizedEvent -> framework event` mapping, in {@link emit}, so the
 *     per-bridge code stays a pure parser.
 *
 * The framework push surface this writes through —
 * `pushStart / pushTextStart / pushTextDelta / pushTextEnd /
 *  pushThinkingStart / pushThinkingDelta / pushThinkingEnd /
 *  pushToolCallStart / pushToolCallDelta / pushToolCallEnd /
 *  pushDone / pushError` on {@link AssistantMessageEventStream} — is consumed
 * verbatim from the framework; this module never re-derives event shapes.
 *
 * Streaming contract honored (matching the framework's own adapters): a text or
 * thinking block opens with a `*_start` once the block has been appended to
 * `partial.content`, streams `*_delta`s while the running content accumulates
 * in-place, and closes with a `*_end` carrying the final content. A tool call is
 * a single self-contained block (`start -> delta(args) -> end`). The terminal
 * `done` / `error` event carries the fully-accumulated message.
 */
import type { AssistantMessage, BridgeEventSink } from "./contract";
/**
 * The model-identity fields stamped onto every `partial` {@link AssistantMessage}
 * the sink emits. A bridge supplies these from the bound {@link Model} so a
 * runtime-backed turn reports the same `api` / `provider` / `model` triple a
 * network turn would — keeping the accumulated message uniform regardless of
 * which path produced it.
 */
export interface BridgeMessageSeed {
    /** The bound model's `api` dialect identifier. */
    readonly api: AssistantMessage["api"];
    /** The bound model's provider slug. */
    readonly provider: AssistantMessage["provider"];
    /** The bound model's id (the value stamped into `AssistantMessage.model`). */
    readonly model: string;
}
/**
 * Construct a {@link BridgeEventSink} seeded with the bound model's identity.
 * The single sanctioned way a bridge obtains a sink: it creates one, drives it
 * with {@link NormalizedEvent}s (or the convenience emitters), and returns
 * {@link BridgeEventSink.stream}. The imperative push idiom lives entirely
 * inside the returned sink.
 *
 * @param seed the bound model's `api` / `provider` / `model` identity
 */
export declare function createBridgeSink(seed: BridgeMessageSeed): BridgeEventSink;
