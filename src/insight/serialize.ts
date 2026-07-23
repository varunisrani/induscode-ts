// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Serialization — the on-disk NDJSON record shape shared by the file sink and
 * the replay reader.
 *
 * A {@link Signal} is already JSON-ish, but persisting it verbatim would bury the
 * useful fields (phase, ids, timing) inside a nested probe. A {@link TraceRecord}
 * is the flat, self-describing line we actually write: one JSON object per line,
 * carrying the phase, the full probe, and the emission clock. The file sink
 * encodes a record per signal; {@link replay} parses records back into probes.
 *
 * Keeping the record format in one module guarantees the writer and the reader
 * never drift: there is exactly one {@link encodeRecord} and one
 * {@link decodeRecord}, and both sides import them.
 */
import { ClosedProbe, Probe, Signal, SignalPhase } from "./contract";
/** Schema version stamped on every record, so a future reader can branch. */
export declare const RECORD_VERSION: 1;
/**
 * One persisted trace line.
 *
 * Flat and self-describing: a reader needs nothing but the line to reconstruct
 * the signal. The `probe` is a {@link ClosedProbe} when `phase === "close"`.
 */
export interface TraceRecord {
    /** Record schema version; see {@link RECORD_VERSION}. */
    readonly v: typeof RECORD_VERSION;
    /** The signal phase this record carries. */
    readonly phase: SignalPhase;
    /** The probe value at the moment the signal fired. */
    readonly probe: Probe;
    /** Emission clock, epoch ms. */
    readonly at: number;
}
/** Line feed (U+000A): the one and only record boundary. */
export declare const LINE_FEED = "\n";
/** Project a {@link Signal} onto its flat {@link TraceRecord}. */
export declare function signalToRecord(signal: Signal): TraceRecord;
/**
 * Encode a signal as one separator-safe NDJSON line.
 *
 * @returns the JSON line terminated by a single line feed
 */
export declare function encodeRecord(signal: Signal): string;
/**
 * Parse one NDJSON line into a {@link TraceRecord}.
 *
 * @throws SyntaxError when the line is not valid JSON
 * @returns the decoded record (callers validate the shape before trusting it)
 */
export declare function decodeRecord(line: string): TraceRecord;
/** Whether a decoded record's probe is a terminal {@link ClosedProbe}. */
export declare function recordIsClose(record: TraceRecord): record is TraceRecord & {
    probe: ClosedProbe;
};
