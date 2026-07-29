/**
 * Insight contract — the FROZEN type surface of the unified tracing system.
 */

export type TrailId = string & { readonly __brand: "TrailId" };
export type ProbeId = string & { readonly __brand: "ProbeId" };

export const ID_WIDTHS = {
  trail: 16,
  probe: 8,
} as const;

export function asTrailId(raw: string): TrailId {
  return raw as TrailId;
}

export function asProbeId(raw: string): ProbeId {
  return raw as ProbeId;
}

export type ProbeKind = "run" | "turn" | "tool" | "model" | "custom";

export const PROBE_KINDS: readonly ProbeKind[] = ["run", "turn", "tool", "model", "custom"];

export type ProbeStatus = "open" | "ok" | "error";
export type ProbeOutcome = "ok" | "error";

export interface ProbeFault {
  readonly message: string;
  readonly name?: string;
  readonly stack?: string;
}

export type ProbeAttributes = Readonly<Record<string, unknown>>;

export interface Probe {
  readonly id: ProbeId;
  readonly trailId: TrailId;
  readonly parentId: ProbeId | null;
  readonly kind: ProbeKind;
  readonly name: string;
  readonly startedAt: number;
  readonly endedAt?: number;
  readonly status: ProbeStatus;
  readonly attributes: ProbeAttributes;
  readonly fault?: ProbeFault;
}

export interface ClosedProbe extends Probe {
  readonly endedAt: number;
  readonly status: ProbeOutcome;
}

export function isClosedProbe(probe: Probe): probe is ClosedProbe {
  return probe.status !== "open" && typeof probe.endedAt === "number";
}

export interface ProbeHandle {
  readonly trailId: TrailId;
  readonly id: ProbeId;
  readonly sampled: boolean;
  note(attributes: ProbeAttributes): void;
  child(kind: ProbeKind, name: string, attributes?: ProbeAttributes): ProbeHandle;
  fail(error: unknown): void;
  close(outcome?: ProbeOutcome): void;
}

export const NOOP_HANDLE: ProbeHandle = Object.freeze({
  trailId: "" as TrailId,
  id: "" as ProbeId,
  sampled: false,
  note(): void {
    /* no-op */
  },
  child(): ProbeHandle {
    return NOOP_HANDLE;
  },
  fail(): void {
    /* no-op */
  },
  close(): void {
    /* no-op */
  },
});

export type SignalPhase = "open" | "update" | "close";

export interface OpenSignal {
  readonly phase: "open";
  readonly probe: Probe;
  readonly at: number;
}

export interface UpdateSignal {
  readonly phase: "update";
  readonly probe: Probe;
  readonly at: number;
}

export interface CloseSignal {
  readonly phase: "close";
  readonly probe: ClosedProbe;
  readonly at: number;
}

export type Signal = OpenSignal | UpdateSignal | CloseSignal;

export function isCloseSignal(signal: Signal): signal is CloseSignal {
  return signal.phase === "close";
}

export type SignalEmit = (signal: Signal) => void;

export interface SampleGate {
  admit(rootName: string): boolean;
}

export interface FixedGates {
  readonly always: SampleGate;
  readonly never: SampleGate;
}

export type SignalStream = AsyncIterable<Signal>;

export interface Sink {
  readonly id: string;
  drain(stream: SignalStream): Promise<void>;
}

export interface OpenTrailInput {
  readonly name: string;
  readonly kind?: ProbeKind;
  readonly trailId?: TrailId;
  readonly attributes?: ProbeAttributes;
}

export interface Recorder {
  readonly service: string;
  readonly enabled: boolean;
  openTrail(input: OpenTrailInput): ProbeHandle;
  scope(trailId: TrailId): TrailRecorder;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface TrailRecorder {
  readonly trailId: TrailId;
  readonly sampled: boolean;
  open(kind: ProbeKind, name: string, attributes?: ProbeAttributes): ProbeHandle;
  child(parentId: ProbeId, kind: ProbeKind, name: string, attributes?: ProbeAttributes): ProbeHandle;
}

export const REDACTED_TOKEN = "[insight:scrubbed]" as const;
export type RedactedToken = typeof REDACTED_TOKEN;

export interface RedactionRule {
  readonly id: string;
  readonly key?: string | RegExp;
  readonly value?: RegExp;
}

export interface RedactionOptions {
  readonly maxStringLength?: number;
  readonly omitKeys?: readonly string[];
}

export interface SecretRedactor {
  readonly rules: readonly RedactionRule[];
  scrubValue(value: unknown): unknown;
  scrubAttributes(attributes: ProbeAttributes): ProbeAttributes;
  scrub(probe: Probe): Probe;
}

export const PASSTHRU_REDACTOR: SecretRedactor = Object.freeze({
  rules: Object.freeze([]),
  scrubValue(value: unknown): unknown {
    return value;
  },
  scrubAttributes(attributes: ProbeAttributes): ProbeAttributes {
    return attributes;
  },
  scrub(probe: Probe): Probe {
    return probe;
  },
});