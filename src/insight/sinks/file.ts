/**
 * File sink — drains signals to an append-only NDJSON trace file.
 */
import { mkdir, open } from "node:fs/promises";
import { dirname } from "node:path";
import type { Sink } from "../contract.js";
import { encodeRecord } from "../serialize.js";

export interface FileSinkOptions {
  readonly path: string;
  readonly id?: string;
  readonly mkdirp?: boolean;
  readonly truncate?: boolean;
}

export function createFileSink(options: FileSinkOptions): Sink {
  const id = options.id ?? "file";
  const mode = options.truncate ? "w" : "a";
  return {
    id,
    async drain(stream) {
      let handle: Awaited<ReturnType<typeof open>> | null = null;
      try {
        for await (const signal of stream) {
          if (handle === null) {
            if (options.mkdirp ?? true) {
              await mkdir(dirname(options.path), { recursive: true });
            }
            handle = await open(options.path, mode);
          }
          await handle.write(encodeRecord(signal));
        }
      } finally {
        if (handle !== null) {
          await handle.close();
        }
      }
    },
  };
}