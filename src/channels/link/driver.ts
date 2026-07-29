/**
 * Link driver — the generated client over the JSON-RPC link.
 */
import {
  DEFAULT_CHANNEL_TIMINGS,
  PROTOCOL_VERSION,
  REQUEST_ID_PREFIX,
  isReplyOk,
  type Ask,
  type ChannelTimings,
  type LinkDriver,
  type NdjsonFramer,
  type OpError,
  type OpRegistry,
  type ReadableChunks,
  type Reply,
  type Signal,
  type WritableLine,
} from "../contract.js";
import { ndjsonFramer } from "../framer.js";

export interface LinkDriverIo {
  readonly out: WritableLine;
  readonly in: ReadableChunks;
}

export interface LinkDriverConfig {
  readonly framer?: NdjsonFramer;
  readonly timings?: Partial<ChannelTimings>;
  readonly onSignal?: (signal: Signal) => void;
  readonly onAsk?: (ask: Ask) => unknown | Promise<unknown>;
}

export class LinkRequestError extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(error: OpError) {
    super(error.message);
    this.name = "LinkRequestError";
    this.code = error.code;
    this.data = error.data;
  }
}

export interface LinkDriverHandle<Ops extends OpRegistry> {
  readonly client: LinkDriver<Ops>;
  readonly done: Promise<void>;
  close(reason?: string): void;
}

function isReplyFrame(frame: unknown): frame is Reply {
  if (typeof frame !== "object" || frame === null) return false;
  const f = frame as Record<string, unknown>;
  return f.id !== undefined && ("result" in f || "error" in f);
}

function isSignalFrame(frame: unknown): frame is Signal {
  return (
    typeof frame === "object" &&
    frame !== null &&
    (frame as { type?: unknown }).type === "signal"
  );
}

function isAskFrame(frame: unknown): frame is Ask {
  return (
    typeof frame === "object" &&
    frame !== null &&
    (frame as { type?: unknown }).type === "ask" &&
    typeof (frame as { id?: unknown }).id === "string"
  );
}

function resolveTimings(
  overrides: Partial<ChannelTimings> | undefined,
): ChannelTimings {
  return { ...DEFAULT_CHANNEL_TIMINGS, ...overrides };
}

interface PendingEntry {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Build a {@link LinkDriverHandle} over an injected transport.
 */
export function createLinkDriver<Ops extends OpRegistry = OpRegistry>(
  io: LinkDriverIo,
  config: LinkDriverConfig = {},
): LinkDriverHandle<Ops> {
  const framer = config.framer ?? ndjsonFramer;
  const timings = resolveTimings(config.timings);
  const pending = new Map<string, PendingEntry>();
  let seq = 0;
  let closed = false;

  function nextId(): string {
    seq += 1;
    return `${REQUEST_ID_PREFIX}${Date.now().toString(36)}-${seq.toString(36)}`;
  }

  function request(method: string, params?: unknown): Promise<unknown> {
    if (closed) {
      return Promise.reject(new Error("link driver is closed"));
    }
    const id = nextId();
    const frame =
      params === undefined
        ? { jsonrpc: PROTOCOL_VERSION, id, method }
        : { jsonrpc: PROTOCOL_VERSION, id, method, params };
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`link request timed out: ${method}`));
      }, timings.requestMs);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
      pending.set(id, { resolve, reject, timer });
      io.out.write(framer.encodeLine(frame));
    });
  }

  function settleReply(reply: Reply): void {
    const entry = pending.get(String(reply.id));
    if (entry === undefined) return;
    pending.delete(String(reply.id));
    clearTimeout(entry.timer);
    if (isReplyOk(reply)) {
      entry.resolve(reply.result);
    } else {
      entry.reject(new LinkRequestError(reply.error));
    }
  }

  async function answerAsk(ask: Ask): Promise<void> {
    const value = config.onAsk ? await config.onAsk(ask) : null;
    const answer = { type: "answer", id: ask.id, value };
    io.out.write(framer.encodeLine(answer));
  }

  function rejectAll(reason: string): void {
    for (const [, entry] of pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    }
    pending.clear();
  }

  async function pump(): Promise<void> {
    try {
      for await (const frame of framer.decodeLines(io.in)) {
        if (isReplyFrame(frame)) {
          settleReply(frame);
          continue;
        }
        if (isSignalFrame(frame)) {
          config.onSignal?.(frame);
          continue;
        }
        if (isAskFrame(frame)) {
          await answerAsk(frame);
          continue;
        }
      }
    } finally {
      closed = true;
      rejectAll("link closed before reply");
    }
  }

  const client = new Proxy({} as LinkDriver<Ops>, {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return (params?: unknown) => request(prop, params);
    },
  });

  return {
    client,
    done: pump(),
    close(reason: string = "link driver closed by caller"): void {
      closed = true;
      rejectAll(reason);
    },
  };
}