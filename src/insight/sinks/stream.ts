/**
 * Stream sink — forwards signals to a network/byte stream, or collects them.
 */
import type { Signal, Sink } from "../contract.js";
import { encodeRecord } from "../serialize.js";

export interface SignalWriter {
  write(line: string): unknown | Promise<unknown>;
  end?(): unknown | Promise<unknown>;
}

export interface StreamSinkOptions {
  readonly writer: SignalWriter;
  readonly id?: string;
  readonly endOnFinish?: boolean;
}

export function createStreamSink(options: StreamSinkOptions): Sink {
  const id = options.id ?? "stream";
  const endOnFinish = options.endOnFinish ?? true;
  return {
    id,
    async drain(stream) {
      try {
        for await (const signal of stream) {
          await options.writer.write(encodeRecord(signal));
        }
      } finally {
        if (endOnFinish && options.writer.end !== undefined) {
          await options.writer.end();
        }
      }
    },
  };
}

export interface CollectorSink extends Sink {
  readonly signals: readonly Signal[];
}

export function createCollectorSink(id: string = "collector"): CollectorSink {
  const signals: Signal[] = [];
  return {
    id,
    get signals(): readonly Signal[] {
      return signals;
    },
    async drain(stream) {
      for await (const signal of stream) {
        signals.push(signal);
      }
    },
  };
}