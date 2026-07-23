// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Insight subsystem — public barrel.
 *
 * `insight/` is the agent's single observability plane. It re-exports the FROZEN
 * contract: the id model ({@link TrailId} / {@link ProbeId}), the immutable
 * {@link Probe} value and its functional {@link ProbeHandle} (with the shared
 * sampled-out {@link NOOP_HANDLE}), the wire {@link Signal} union, the
 * {@link SampleGate} admission contract, the {@link Sink} drain interface, the
 * {@link Recorder} / {@link TrailRecorder} facades, and the
 * {@link SecretRedactor} attribute processor (with its {@link REDACTED_TOKEN}).
 *
 * Behaviour modules (the recorder, the flush buffer, the console / file / stream
 * sinks, the redactor implementation, the agent and stream bridges, the session
 * rehydrator, the ledger, and the dashboard panel) are added to this barrel as
 * they land; consumers import the insight surface from `src/insight` rather than
 * reaching into individual modules.
 */
export type { TrailId, ProbeId, ProbeKind, ProbeStatus, ProbeOutcome, ProbeFault, ProbeAttributes, Probe, ClosedProbe, ProbeHandle, SignalPhase, OpenSignal, UpdateSignal, CloseSignal, Signal, SignalEmit, SampleGate, FixedGates, SignalStream, Sink, OpenTrailInput, Recorder, TrailRecorder, RedactedToken, RedactionRule, RedactionOptions, SecretRedactor, } from "./contract";
export { ID_WIDTHS, asTrailId, asProbeId, PROBE_KINDS, isClosedProbe, NOOP_HANDLE, isCloseSignal, REDACTED_TOKEN, PASSTHRU_REDACTOR, } from "./contract";
export { alwaysGate, neverGate, ratioGate, isRatioGate, hash32, trailScore, FIXED_GATES, type RatioGate, } from "./sampling";
export { createChannel, type SignalChannel } from "./channel";
export { createRecorder, mintTrailId, mintProbeId, faultOf, type RecorderOptions, type InsightRecorder, } from "./recorder";
export { createRedactor, DEFAULT_REDACTOR, DEFAULT_REDACTION_RULES, } from "./redaction";
export { encodeRecord, decodeRecord, signalToRecord, recordIsClose, RECORD_VERSION, LINE_FEED, type TraceRecord, } from "./serialize";
export { createConsoleSink, createFileSink, createStreamSink, createCollectorSink, type ConsoleSinkOptions, type LineWriter, type FileSinkOptions, type StreamSinkOptions, type SignalWriter, type CollectorSink, } from "./sinks/index";
export { readLines, readRecords, replaySignals, replayProbes, replayTrails, type ChunkSource, type ReplayOptions, type ReplayedTrail, } from "./replay";
