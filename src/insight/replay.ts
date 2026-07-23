// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Replay — read an NDJSON trace file back into probes and trails.
 *
 * The file sink writes one {@link TraceRecord} per line; replay is the inverse.
 * It parses a chunk or line stream, validates each record, and exposes the
 * recovered probes in three increasingly cooked forms:
 *
 *   - {@link replaySignals} — the raw {@link Signal} stream, in file order;
 *   - {@link replayProbes} — the final probe value per id (close wins over open),
 *     which is what you usually want for offline analysis;
 *   - {@link replayTrails} — the probes grouped into per-trail trees, each with a
 *     root and a parent->children map, ready to render.
 *
 * Replay never imports the framework and performs no recording — it is a pure
 * reader over the durable format pinned in `serialize.ts`. A malformed line is,
 * by default, skipped rather than fatal, so a trace truncated by a crash still
 * yields everything written before the break.
 */
import { Probe, ProbeId, Signal, TrailId } from "./contract";
import { TraceRecord } from "./serialize";
/** A source of raw bytes/text chunks (a file read stream, stdin, a buffer). */
export type ChunkSource = AsyncIterable<string | Uint8Array> | Iterable<string | Uint8Array>;
/** Options shared by the replay readers. */
export interface ReplayOptions {
    /** Throw on a malformed line instead of skipping it; defaults to `false`. */
    readonly strict?: boolean;
}
/**
 * Split a chunk source into complete text lines.
 *
 * Buffers across chunks, splits on `\n` only, and emits a trailing unterminated
 * line at end-of-stream so a final non-newline frame is not dropped.
 */
export declare function readLines(source: ChunkSource): AsyncGenerator<string, void, unknown>;
/**
 * Decode a chunk source into a stream of validated {@link TraceRecord}s.
 *
 * Malformed JSON or a record failing the shape check is skipped (or rethrown
 * when `strict`).
 */
export declare function readRecords(source: ChunkSource, options?: ReplayOptions): AsyncGenerator<TraceRecord, void, unknown>;
/** Reconstruct the {@link Signal} stream from a chunk source, in file order. */
export declare function replaySignals(source: ChunkSource, options?: ReplayOptions): AsyncGenerator<Signal, void, unknown>;
/**
 * Collapse a trace into the final value of each probe, keyed by id.
 *
 * Records arrive in lifecycle order (open -> update* -> close); the last record
 * for an id wins, so a closed probe supersedes its open. The returned map
 * preserves first-seen insertion order.
 */
export declare function replayProbes(source: ChunkSource, options?: ReplayOptions): Promise<Map<ProbeId, Probe>>;
/** One reconstructed trail: its root probe plus the parent->children index. */
export interface ReplayedTrail {
    /** The trail id every probe in this tree shares. */
    readonly trailId: TrailId;
    /** The root probe (parentId === null), or `null` if the root was never seen. */
    readonly root: Probe | null;
    /** Every probe in the trail, keyed by id, in first-seen order. */
    readonly probes: ReadonlyMap<ProbeId, Probe>;
    /** Child probe ids per parent id; roots are listed under the empty key. */
    readonly children: ReadonlyMap<ProbeId | null, readonly ProbeId[]>;
    /** Whether every probe in the trail reached a terminal state. */
    readonly complete: boolean;
}
/**
 * Group a trace into per-trail trees.
 *
 * Each {@link ReplayedTrail} carries its probes, a parent->children adjacency
 * map (so a renderer can walk the tree without re-scanning), the located root,
 * and a completeness flag. Trails appear in the order their first probe was
 * seen.
 *
 * @param source the NDJSON chunk source
 * @param options see {@link ReplayOptions}
 * @returns one {@link ReplayedTrail} per distinct trail id
 */
export declare function replayTrails(source: ChunkSource, options?: ReplayOptions): Promise<ReplayedTrail[]>;
