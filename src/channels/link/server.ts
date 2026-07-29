/**
 * Link server — the data-driven JSON-RPC 2.0 dispatch loop.
 */
import {
  DEFAULT_CHANNEL_TIMINGS,
  OP_ERROR,
  PROTOCOL_VERSION,
  type AskAnswer,
  type ChannelContext,
  type NdjsonFramer,
  type OpError,
  type OpRegistry,
  type ReadableChunks,
  type Reply,
  type SessionConductor,
  type WritableLine,
} from "../contract.js";
import { ndjsonFramer } from "../framer.js";
import { dispatch, UnknownOpError } from "../ops.js";
import { createDialogBridge, type LinkedDialogBridge } from "./dialog.js";

export interface LinkServerIo {
  readonly in: ReadableChunks;
  readonly out: WritableLine;
}

export interface LinkServerConfig {
  readonly framer?: NdjsonFramer;
  readonly timings?: Partial<typeof DEFAULT_CHANNEL_TIMINGS>;
}

export interface LinkServer {
  readonly done: Promise<void>;
  readonly dialog: LinkedDialogBridge;
}

function isRequestFrame(frame: unknown): frame is { method: string; id?: unknown; params?: unknown } {
  return (
    typeof frame === "object" && frame !== null && typeof (frame as { method?: unknown }).method === "string"
  );
}

function isAnswerFrame(frame: unknown): frame is AskAnswer {
  return (
    typeof frame === "object" &&
    frame !== null &&
    (frame as { type?: unknown }).type === "answer" &&
    typeof (frame as { id?: unknown }).id === "string"
  );
}

function toOpError(error: unknown): OpError {
  if (error instanceof UnknownOpError) {
    return { code: error.code, message: error.message, data: { method: error.method } };
  }
  const message = error instanceof Error ? error.message : String(error);
  return { code: OP_ERROR.handlerFailed, message };
}

function resolveTimings(
  overrides: Partial<typeof DEFAULT_CHANNEL_TIMINGS> | undefined,
): typeof DEFAULT_CHANNEL_TIMINGS {
  return { ...DEFAULT_CHANNEL_TIMINGS, ...overrides };
}

/**
 * Start a link server over an op registry, a conductor, and an injected
 * transport.
 */
export function createLinkServer(
  registry: OpRegistry,
  conductor: SessionConductor,
  io: LinkServerIo,
  config: LinkServerConfig = {},
): LinkServer {
  const framer = config.framer ?? ndjsonFramer;
  const timings = resolveTimings(config.timings);
  const dialog = createDialogBridge({ out: io.out, framer, timings });
  const ctx: ChannelContext = {
    conductor,
    out: io.out,
    framer,
    dialog,
  };

  function writeReply(reply: Reply): void {
    io.out.write(framer.encodeLine(reply));
  }

  function replyOk(id: unknown, result: unknown): void {
    writeReply({ jsonrpc: PROTOCOL_VERSION, id: id as Reply["id"], result });
  }

  function replyErr(id: unknown, error: OpError): void {
    writeReply({ jsonrpc: PROTOCOL_VERSION, id: id as Reply["id"], error });
  }

  async function handleRequest(frame: { method: string; id?: unknown; params?: unknown }): Promise<void> {
    const wantsReply = frame.id !== undefined;
    try {
      const result = await dispatch(registry, frame.method, frame.params, ctx);
      if (wantsReply) {
        replyOk(frame.id, result);
      }
    } catch (error) {
      if (wantsReply) {
        replyErr(frame.id, toOpError(error));
      }
    }
  }

  async function pump(): Promise<void> {
    const inflight = new Set<Promise<void>>();
    try {
      for await (const frame of framer.decodeLines(io.in)) {
        if (isAnswerFrame(frame)) {
          dialog.deliver({ type: "answer", id: frame.id, value: frame.value });
          continue;
        }
        if (isRequestFrame(frame)) {
          const task = handleRequest(frame);
          inflight.add(task);
          void task.finally(() => inflight.delete(task));
          continue;
        }
      }
      await Promise.all(inflight);
    } finally {
      dialog.drain();
    }
  }

  return { done: pump(), dialog };
}