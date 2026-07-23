// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * File sink — drains signals to an append-only NDJSON trace file.
 *
 * Each signal becomes one {@link TraceRecord} line via {@link encodeRecord}; the
 * file is opened for append (created if absent) and every record is flushed to
 * the OS write buffer as it arrives, so a crash mid-trail still leaves a readable
 * prefix that {@link replay} can parse. The handle is closed when the stream is
 * exhausted.
 *
 * The file is the durable counterpart to the ephemeral stream sink: what the
 * file sink writes, the replay reader reads back, with the record format pinned
 * in `serialize.ts` so the two never disagree.
 */
import { Sink } from "../contract";
/** Construction options for {@link createFileSink}. */
export interface FileSinkOptions {
    /** Filesystem path the NDJSON trace is appended to. */
    readonly path: string;
    /** Sink id; defaults to `"file"`. */
    readonly id?: string;
    /** Create the parent directory if missing; defaults to `true`. */
    readonly mkdirp?: boolean;
    /** Truncate the file on open instead of appending; defaults to `false`. */
    readonly truncate?: boolean;
}
/**
 * Build a {@link Sink} that appends one NDJSON record per signal to a file.
 *
 * The file is opened lazily on the first drained signal (so constructing a sink
 * that is never used touches no disk), then closed when the stream ends or
 * throws. `mkdirp` ensures the parent directory exists; `truncate` starts a
 * fresh file rather than appending.
 *
 * @param options see {@link FileSinkOptions}
 * @returns a file {@link Sink}
 */
export declare function createFileSink(options: FileSinkOptions): Sink;
