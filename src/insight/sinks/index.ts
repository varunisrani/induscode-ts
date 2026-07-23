// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Sinks barrel — the terminal consumers of a {@link Signal} stream.
 *
 * Three concrete {@link Sink} factories, each of which drains an independent
 * {@link SignalStream} obtained from the recorder's channel:
 *
 *   - {@link createConsoleSink} — one human line per signal to a TTY / writer;
 *   - {@link createFileSink} — append-only NDJSON to a path (durable);
 *   - {@link createStreamSink} — NDJSON forwarded to an injected byte writer;
 *   - {@link createCollectorSink} — an in-memory array (tests / inspection).
 *
 * All four are framework-agnostic and share the record format in `serialize.ts`.
 */
export { createConsoleSink, type ConsoleSinkOptions, type LineWriter, } from "./console";
export { createFileSink, type FileSinkOptions, } from "./file";
export { createStreamSink, createCollectorSink, type StreamSinkOptions, type SignalWriter, type CollectorSink, } from "./stream";
