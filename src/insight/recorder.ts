/**
 * Recorder — the trail/probe factory at the head of the pipeline.
 */
import { randomBytes } from "node:crypto";
import { createChannel, type SignalChannel } from "./channel.js";
import {
  asProbeId,
  asTrailId,
  ID_WIDTHS,
  NOOP_HANDLE,
  PASSTHRU_REDACTOR,
  type OpenTrailInput,
  type Probe,
  type ProbeAttributes,
  type ProbeFault,
  type ProbeHandle,
  type ProbeId,
  type ProbeKind,
  type ProbeOutcome,
  type Recorder,
  type SampleGate,
  type SecretRedactor,
  type Signal,
  type Sink,
  type TrailId,
  type TrailRecorder,
} from "./contract.js";
import { alwaysGate, isRatioGate, neverGate } from "./sampling.js";

export function mintTrailId(): TrailId {
  return asTrailId(randomBytes(ID_WIDTHS.trail).toString("hex"));
}

export function mintProbeId(): ProbeId {
  return asProbeId(randomBytes(ID_WIDTHS.probe).toString("hex"));
}

export interface RecorderOptions {
  readonly service?: string;
  readonly enabled?: boolean;
  readonly gate?: SampleGate;
  readonly redactor?: SecretRedactor;
  readonly sinks?: readonly Sink[];
  readonly now?: () => number;
}

export interface InsightRecorder extends Recorder {
  readonly channel: SignalChannel;
}

export function faultOf(error: unknown): ProbeFault {
  if (error instanceof Error) {
    const fault: { message: string; name?: string; stack?: string } = {
      message: error.message,
      name: error.name,
    };
    if (typeof error.stack === "string") {
      fault.stack = error.stack;
    }
    return Object.freeze(fault);
  }
  return Object.freeze({ message: String(error) });
}

export function createRecorder(options: RecorderOptions = {}): InsightRecorder {
  const service = options.service ?? "insight";
  const enabled = options.enabled ?? true;
  const gate: SampleGate = enabled ? options.gate ?? alwaysGate : neverGate;
  const redactor = options.redactor ?? PASSTHRU_REDACTOR;
  const now = options.now ?? Date.now;
  const channel = createChannel();
  const drains: Promise<void>[] = [];
  for (const sink of options.sinks ?? []) {
    drains.push(sink.drain(channel.stream()));
  }

  const route = (signal: Signal): void => {
    const scrubbed = redactor.scrub(signal.probe);
    if (scrubbed === signal.probe) {
      channel.emit(signal);
      return;
    }
    if (signal.phase === "close") {
      channel.emit({
        phase: "close",
        probe: scrubbed as Probe & { endedAt: number; status: ProbeOutcome },
        at: signal.at,
      });
    } else {
      channel.emit({ phase: signal.phase, probe: scrubbed, at: signal.at });
    }
  };

  function admit(trailId: TrailId, rootName: string): boolean {
    if (!enabled) return false;
    if (isRatioGate(gate)) return gate.verdict(trailId);
    return gate.admit(rootName);
  }

  function openProbe(
    trailId: TrailId,
    parentId: ProbeId | null,
    kind: ProbeKind,
    name: string,
    attributes: ProbeAttributes,
  ): ProbeHandle {
    const id = mintProbeId();
    const startedAt = now();
    interface Cell {
      probe: Probe;
      closed: boolean;
    }
    const cell: Cell = {
      probe: Object.freeze({
        id,
        trailId,
        parentId,
        kind,
        name,
        startedAt,
        status: "open" as const,
        attributes: Object.freeze({ ...attributes }),
      }),
      closed: false,
    };
    route({ phase: "open", probe: cell.probe, at: startedAt });
    const handle: ProbeHandle = {
      trailId,
      id,
      sampled: true,
      note(extra: ProbeAttributes): void {
        if (cell.closed) return;
        cell.probe = Object.freeze({
          ...cell.probe,
          attributes: Object.freeze({ ...cell.probe.attributes, ...extra }),
        });
        route({ phase: "update", probe: cell.probe, at: now() });
      },
      child(childKind: ProbeKind, childName: string, childAttrs: ProbeAttributes = {}): ProbeHandle {
        if (cell.closed) return NOOP_HANDLE;
        return openProbe(trailId, id, childKind, childName, childAttrs);
      },
      fail(error: unknown): void {
        if (cell.closed) return;
        cell.probe = Object.freeze({
          ...cell.probe,
          status: "error" as const,
          fault: faultOf(error),
        });
        route({ phase: "update", probe: cell.probe, at: now() });
      },
      close(outcome?: ProbeOutcome): void {
        if (cell.closed) return;
        cell.closed = true;
        const endedAt = now();
        const status: ProbeOutcome =
          outcome ?? (cell.probe.status === "error" ? "error" : "ok");
        const closed = Object.freeze({
          ...cell.probe,
          endedAt,
          status,
        });
        cell.probe = closed;
        route({ phase: "close", probe: closed, at: endedAt });
      },
    };
    return handle;
  }

  function openTrail(input: OpenTrailInput): ProbeHandle {
    const trailId = input.trailId ?? mintTrailId();
    if (!admit(trailId, input.name)) {
      return NOOP_HANDLE;
    }
    return openProbe(trailId, null, input.kind ?? "run", input.name, input.attributes ?? {});
  }

  function scope(trailId: TrailId): TrailRecorder {
    const sampled = admit(trailId, service);
    return {
      trailId,
      sampled,
      open(kind: ProbeKind, name: string, attrs: ProbeAttributes = {}): ProbeHandle {
        if (!sampled) return NOOP_HANDLE;
        return openProbe(trailId, null, kind, name, attrs);
      },
      child(parentId: ProbeId, kind: ProbeKind, name: string, attrs: ProbeAttributes = {}): ProbeHandle {
        if (!sampled) return NOOP_HANDLE;
        return openProbe(trailId, parentId, kind, name, attrs);
      },
    };
  }

  async function flush(): Promise<void> {
    await Promise.resolve();
  }

  async function shutdown(): Promise<void> {
    await flush();
    channel.close();
    await Promise.allSettled(drains);
  }

  return {
    service,
    enabled,
    channel,
    openTrail,
    scope,
    flush,
    shutdown,
  };
}