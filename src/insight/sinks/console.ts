/**
 * Console sink — drains signals to a writable, one human-readable line each.
 */
import type { Sink } from "../contract.js";

export interface LineWriter {
  write(chunk: string): unknown;
  readonly isTTY?: boolean;
}

export interface ConsoleSinkOptions {
  readonly writer?: LineWriter;
  readonly color?: boolean;
  readonly id?: string;
}

const SGR = {
  reset: "\x1B[0m",
  dim: "\x1B[2m",
  green: "\x1B[32m",
  red: "\x1B[31m",
  cyan: "\x1B[36m",
};

function paint(on: boolean, code: string, text: string): string {
  return on ? code + text + SGR.reset : text;
}

function label(probe: { kind: string; name: string }): string {
  return probe.kind + "/" + probe.name;
}

function formatSignal(
  signal: import("../contract.js").Signal,
  color: boolean,
): string {
  const p = signal.probe;
  const ids = p.trailId.slice(0, 8) + ":" + p.id.slice(0, 6);
  if (signal.phase === "close") {
    const closed = p;
    const ms = (closed.endedAt ?? 0) - closed.startedAt;
    const ok = closed.status === "ok";
    const tag = paint(color, ok ? SGR.green : SGR.red, closed.status);
    const dur = paint(color, SGR.dim, `${ms}ms`);
    return `close ${tag} ${label(closed)} ${dur} ${ids}`;
  }
  const head = paint(color, SGR.cyan, signal.phase);
  const body = paint(color, SGR.dim, `${label(p)} ${ids}`);
  return `${head} ${body}`;
}

export function createConsoleSink(options: ConsoleSinkOptions = {}): Sink {
  const writer: LineWriter = options.writer ?? (process.stdout as unknown as LineWriter);
  const color = options.color ?? writer.isTTY ?? false;
  const id = options.id ?? "console";
  return {
    id,
    async drain(stream) {
      for await (const signal of stream) {
        writer.write(formatSignal(signal, color) + "\n");
      }
    },
  };
}