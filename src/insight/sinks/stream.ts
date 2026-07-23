// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Stream sink — forwards signals to a network/byte stream, or collects them.
 *
 * Two shapes share this module because both are "drain into something live":
 *
 *   - {@link createStreamSink} writes each signal as an NDJSON line to an
 *     injected byte/string writer (a socket, a child pipe, an SSE response),
 *     using the same record format as the file sink;
 *   - {@link createCollectorSink} appends every signal to an in-memory array, the
 *     trivial test/inspection sink.
 *
 * Neither owns a transport: the byte writer is injected, so the same sink feeds a
 * TCP socket, an HTTP chunked body, or an in-process pair without code change.
 */
import { Signal, Sink } from "../contract";
/** The minimal push-style writer the stream sink forwards lines to. */
export interface SignalWriter {
    /** Append one already-encoded NDJSON line. May be async. */
    write(line: string): unknown | Promise<unknown>;
    /** Optional end-of-stream hook, called once the source is exhausted. */
    end?(): unknown | Promise<unknown>;
}
/** Construction options for {@link createStreamSink}. */
export interface StreamSinkOptions {
    /** Where encoded lines are forwarded. */
    readonly writer: SignalWriter;
    /** Sink id; defaults to `"stream"`. */
    readonly id?: string;
    /** Call `writer.end()` when the source stream ends; defaults to `true`. */
    readonly endOnFinish?: boolean;
}
/**
 * Build a {@link Sink} that forwards each signal as an NDJSON line to a writer.
 *
 * @param options see {@link StreamSinkOptions}
 * @returns a stream {@link Sink}
 */
export declare function createStreamSink(options: StreamSinkOptions): Sink;
/** A collector {@link Sink} plus the live array it fills. */
export interface CollectorSink extends Sink {
    /** Every signal drained so far, in arrival order. */
    readonly signals: readonly Signal[];
}
/**
 * Build an in-memory {@link Sink} that accumulates every drained signal.
 *
 * The handiest sink for tests and one-shot inspection: drain a recorder's stream
 * through it, then read {@link CollectorSink.signals}.
 *
 * @param id sink id; defaults to `"collector"`
 * @returns a {@link CollectorSink}
 */
export declare function createCollectorSink(id?: string): CollectorSink;
