// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Recorder — the trail/probe factory at the head of the pipeline.
 *
 * {@link createRecorder} returns the single {@link Recorder} the agent talks to.
 * Opening a trail consults the {@link SampleGate}: a sampled-out trail collapses
 * to {@link NOOP_HANDLE} (and its whole probe subtree is free), while a sampled-in
 * trail mints a {@link TrailId}, a root {@link Probe}, and emits an `open`
 * {@link Signal} onto the {@link SignalChannel}. Each live {@link ProbeHandle}
 * carries closures that derive the next frozen probe value on `note` / `fail` /
 * `close` and push the matching signal; `child` mints a sub-probe sharing the
 * trail. The contract's forgiving lifecycle is honoured here: `note` / `child` /
 * `fail` are no-ops after `close`, and `close` is idempotent (first call wins).
 *
 * The recorder runs every probe through a {@link SecretRedactor} just before the
 * signal hits the channel, so no sink ever sees an unscrubbed value. Ids are
 * minted from `node:crypto` random bytes at the W3C-derived widths in
 * {@link ID_WIDTHS}; nothing here imports the framework.
 */
import { SignalChannel } from "./channel";
import { ProbeFault, ProbeId, Recorder, SampleGate, SecretRedactor, Sink, TrailId } from "./contract";
/** Mint a fresh 128-bit {@link TrailId} (32 hex chars). */
export declare function mintTrailId(): TrailId;
/** Mint a fresh 64-bit {@link ProbeId} (16 hex chars). */
export declare function mintProbeId(): ProbeId;
/** Construction options for {@link createRecorder}. */
export interface RecorderOptions {
    /** Service name stamped on the recorder (e.g. for a dashboard panel). */
    readonly service?: string;
    /** Master switch; a disabled recorder is all no-ops regardless of the gate. */
    readonly enabled?: boolean;
    /** Admission gate; defaults to {@link alwaysGate} when enabled. */
    readonly gate?: SampleGate;
    /** Attribute processor run before signals reach a sink; defaults to passthrough. */
    readonly redactor?: SecretRedactor;
    /** Sinks attached at construction; each drains an independent stream. */
    readonly sinks?: readonly Sink[];
    /** Clock source, in epoch ms; defaults to {@link Date.now}. Useful for tests. */
    readonly now?: () => number;
}
/**
 * A {@link Recorder} that also exposes its underlying {@link SignalChannel}.
 *
 * Tests and the pipeline can attach extra streams after construction; the agent
 * only ever sees the {@link Recorder} face.
 */
export interface InsightRecorder extends Recorder {
    /** The channel every live handle emits onto; one stream per attached sink. */
    readonly channel: SignalChannel;
}
/**
 * Create the recorder at the head of the insight pipeline.
 *
 * @param options see {@link RecorderOptions}
 * @returns a live {@link InsightRecorder}
 */
export declare function createRecorder(options?: RecorderOptions): InsightRecorder;
/**
 * Coerce an arbitrary thrown value into a serializable {@link ProbeFault}.
 *
 * An `Error` contributes its message, constructor name, and stack; any other
 * value is rendered to a string message. The result is a plain frozen record.
 */
export declare function faultOf(error: unknown): ProbeFault;
