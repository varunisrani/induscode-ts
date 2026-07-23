// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Signal channel — the in-memory pipe between the recorder and the sinks.
 *
 * The recorder *pushes* {@link Signal}s the instant a probe opens, updates, or
 * closes; a {@link Sink} *pulls* a {@link SignalStream} (an
 * `AsyncIterable<Signal>`) and drains it at its own pace. A
 * {@link SignalChannel} bridges those two models: it is an unbounded
 * push-to-pull queue with back-pressure expressed by pull latency.
 *
 * Mechanics: when a consumer is parked in `next()` awaiting a value, an emitted
 * signal resolves its promise immediately (no buffering). When no consumer is
 * waiting, the signal is appended to an internal buffer and handed out in FIFO
 * order on the next pull. Closing the channel makes the iterator finish once the
 * buffer drains. The channel multiplexes: every call to {@link stream} returns an
 * independent iterator, and each emitted signal is fanned out to all of them, so
 * the console, file, and network sinks can each drain the same trail.
 */
import { SignalEmit, SignalStream } from "./contract";
/**
 * A fan-out push-to-pull pipe of {@link Signal}s.
 *
 * The recorder holds the {@link SignalChannel.emit} end; each sink holds a
 * {@link SignalStream} obtained from {@link SignalChannel.stream}. Producers
 * never block: emitting onto a channel with no parked consumer just buffers.
 */
export interface SignalChannel {
    /** Push one signal to every attached subscriber. A no-op once closed. */
    readonly emit: SignalEmit;
    /** Attach a new independent consumer; returns its pull-model stream. */
    stream(): SignalStream;
    /** How many subscribers are currently attached. */
    readonly size: number;
    /** Whether {@link close} has been called. */
    readonly closed: boolean;
    /** Finish every attached stream once its buffer drains. Idempotent. */
    close(): void;
}
/**
 * Create a fresh, empty {@link SignalChannel}.
 *
 * The returned channel starts with no subscribers; call {@link SignalChannel.stream}
 * once per sink before emitting if those sinks must observe the first signal.
 * (A subscriber only receives signals emitted after it attaches.)
 */
export declare function createChannel(): SignalChannel;
