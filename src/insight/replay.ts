/**
 * Replay — read an NDJSON trace file back into probes and trails.
 */
import {
  isClosedProbe,
  type Probe,
  type ProbeId,
  type Signal,
  type TrailId,
} from "./contract.js";
import { decodeRecord, LINE_FEED, RECORD_VERSION, type TraceRecord } from "./serialize.js";

export type ChunkSource = AsyncIterable<string | Uint8Array> | Iterable<string | Uint8Array>;

export interface ReplayOptions {
  readonly strict?: boolean;
}

const TEXT_DECODER = new TextDecoder();

function chunkToText(chunk: string | Uint8Array): string {
  return typeof chunk === "string" ? chunk : TEXT_DECODER.decode(chunk, { stream: true });
}

export async function* readLines(
  source: ChunkSource,
): AsyncGenerator<string, void, unknown> {
  let buffer = "";
  for await (const chunk of source) {
    buffer += chunkToText(chunk);
    let at = buffer.indexOf(LINE_FEED);
    while (at !== -1) {
      const line = buffer.slice(0, at);
      buffer = buffer.slice(at + 1);
      if (line.trim().length > 0) yield line;
      at = buffer.indexOf(LINE_FEED);
    }
  }
  buffer += TEXT_DECODER.decode();
  if (buffer.trim().length > 0) yield buffer;
}

function isValidRecord(value: unknown): value is TraceRecord {
  if (value === null || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    r.v === RECORD_VERSION &&
    (r.phase === "open" || r.phase === "update" || r.phase === "close") &&
    typeof r.at === "number" &&
    r.probe !== null &&
    typeof r.probe === "object"
  );
}

export async function* readRecords(
  source: ChunkSource,
  options: ReplayOptions = {},
): AsyncGenerator<TraceRecord, void, unknown> {
  for await (const line of readLines(source)) {
    let record: TraceRecord;
    try {
      record = decodeRecord(line);
    } catch (error) {
      if (options.strict) throw error;
      continue;
    }
    if (!isValidRecord(record)) {
      if (options.strict) {
        throw new Error("insight replay: malformed trace record");
      }
      continue;
    }
    yield record;
  }
}

export async function* replaySignals(
  source: ChunkSource,
  options: ReplayOptions = {},
): AsyncGenerator<Signal, void, unknown> {
  for await (const record of readRecords(source, options)) {
    const frozen = Object.freeze({ ...record.probe });
    if (record.phase === "close") {
      yield { phase: "close", probe: frozen as Probe & { endedAt: number; status: "ok" | "error" }, at: record.at };
    } else {
      yield { phase: record.phase, probe: frozen, at: record.at };
    }
  }
}

export async function replayProbes(
  source: ChunkSource,
  options: ReplayOptions = {},
): Promise<Map<ProbeId, Probe>> {
  const byId = new Map<ProbeId, Probe>();
  for await (const record of readRecords(source, options)) {
    byId.set(record.probe.id, Object.freeze({ ...record.probe }));
  }
  return byId;
}

export interface ReplayedTrail {
  readonly trailId: TrailId;
  readonly root: Probe | null;
  readonly probes: ReadonlyMap<ProbeId, Probe>;
  readonly children: ReadonlyMap<ProbeId | null, readonly ProbeId[]>;
  readonly complete: boolean;
}

async function* finalProbes(
  source: ChunkSource,
  options: ReplayOptions,
): AsyncGenerator<Probe, void, unknown> {
  const final = await replayProbes(source, options);
  for (const probe of final.values()) yield probe;
}

function buildTrail(
  trailId: TrailId,
  probes: ReadonlyMap<ProbeId, Probe>,
): ReplayedTrail {
  const children = new Map<ProbeId | null, ProbeId[]>();
  let root: Probe | null = null;
  let complete = true;
  for (const probe of probes.values()) {
    const key = probe.parentId;
    const bucket = children.get(key);
    if (bucket === undefined) children.set(key, [probe.id]);
    else bucket.push(probe.id);
    if (probe.parentId === null) root = probe;
    if (!isClosedProbe(probe)) complete = false;
  }
  return {
    trailId,
    root,
    probes,
    children,
    complete,
  };
}

export async function replayTrails(
  source: ChunkSource,
  options: ReplayOptions = {},
): Promise<ReplayedTrail[]> {
  const probesByTrail = new Map<TrailId, Map<ProbeId, Probe>>();
  const order: TrailId[] = [];
  for await (const probe of finalProbes(source, options)) {
    let bucket = probesByTrail.get(probe.trailId);
    if (bucket === undefined) {
      bucket = new Map();
      probesByTrail.set(probe.trailId, bucket);
      order.push(probe.trailId);
    }
    bucket.set(probe.id, probe);
  }
  return order.map((trailId) => buildTrail(trailId, probesByTrail.get(trailId) ?? new Map()));
}