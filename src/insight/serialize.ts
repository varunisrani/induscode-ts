/**
 * Serialization — the on-disk NDJSON record shape shared by the file sink and
 * the replay reader.
 */
import type { ClosedProbe, Probe, Signal, SignalPhase } from "./contract.js";

export const RECORD_VERSION = 1 as const;

export interface TraceRecord {
  readonly v: typeof RECORD_VERSION;
  readonly phase: SignalPhase;
  readonly probe: Probe;
  readonly at: number;
}

export const LINE_FEED = "\n";
const LINE_SEPARATOR_ESCAPE = "\\u2028";
const PARAGRAPH_SEPARATOR_ESCAPE = "\\u2029";
const SEPARATOR_PATTERN = /[\u2028\u2029]/g;

function escapeSeparators(json: string): string {
  return json.replace(
    SEPARATOR_PATTERN,
    (ch) =>
      ch.charCodeAt(0) === 0x2028 ? LINE_SEPARATOR_ESCAPE : PARAGRAPH_SEPARATOR_ESCAPE,
  );
}

export function signalToRecord(signal: Signal): TraceRecord {
  return {
    v: RECORD_VERSION,
    phase: signal.phase,
    probe: signal.probe,
    at: signal.at,
  };
}

export function encodeRecord(signal: Signal): string {
  return escapeSeparators(JSON.stringify(signalToRecord(signal))) + LINE_FEED;
}

export function decodeRecord(line: string): TraceRecord {
  return JSON.parse(line) as TraceRecord;
}

export function recordIsClose(
  record: TraceRecord,
): record is TraceRecord & { probe: ClosedProbe } {
  return record.phase === "close";
}