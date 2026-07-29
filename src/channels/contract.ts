/**
 * Channels contract — the FROZEN type surface of Phase 8 (non-interactive
 * drivers).
 *
 * A *channel* is a way to talk to a {@link SessionConductor} from outside the
 * interactive terminal.
 */
import type { ImageContent } from "indusagi/ai";
import type {
  ConductorState,
  SessionConductor,
  ThinkingLevel,
  Usage,
} from "../conductor/contract.js";

export type { ImageContent, SessionConductor, ConductorState, ThinkingLevel, Usage };

export const PROTOCOL_VERSION = "2.0" as const;
export type ProtocolVersion = typeof PROTOCOL_VERSION;

export type RequestId = string | number;

export interface OpRequest<P = unknown> {
  readonly jsonrpc: ProtocolVersion;
  readonly id?: RequestId;
  readonly method: string;
  readonly params?: P;
}

export interface OpError {
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}

export interface ReplyOk<R = unknown> {
  readonly jsonrpc: ProtocolVersion;
  readonly id: RequestId;
  readonly result: R;
}

export interface ReplyErr {
  readonly jsonrpc: ProtocolVersion;
  readonly id: RequestId;
  readonly error: OpError;
}

export type Reply<R = unknown> = ReplyOk<R> | ReplyErr;

export function isReplyOk<R>(reply: Reply<R>): reply is ReplyOk<R> {
  return "result" in reply;
}

export const OP_ERROR = Object.freeze({
  parse: -32700,
  invalidRequest: -32600,
  unknownOp: -32601,
  invalidParams: -32602,
  handlerFailed: -32000,
});

export interface WritableLine {
  write(chunk: string, cb?: (error?: Error | null) => void): boolean;
}

export type ReadableChunks = AsyncIterable<string | Uint8Array>;

export type EncodeLine = (value: unknown) => string;
export type DecodeLines = (stream: ReadableChunks) => AsyncGenerator<unknown, void, unknown>;

export interface NdjsonFramer {
  readonly encodeLine: EncodeLine;
  readonly decodeLines: DecodeLines;
}

export interface Ask {
  readonly type: "ask";
  readonly id: string;
  readonly kind: string;
  readonly payload?: unknown;
}

export interface AskAnswer {
  readonly type: "answer";
  readonly id: string;
  readonly value: unknown;
}

export interface Tell {
  readonly type: "tell";
  readonly kind: string;
  readonly payload?: unknown;
}

export interface DialogBridge {
  ask<T>(kind: string, payload: unknown, fallback: T): Promise<T>;
  tell(kind: string, payload?: unknown): void;
}

export interface ChannelContext {
  readonly conductor: SessionConductor;
  readonly out: WritableLine;
  readonly framer: NdjsonFramer;
  readonly dialog: DialogBridge;
}

export interface Op<P = void, R = unknown> {
  readonly method: string;
  handle(params: P, ctx: ChannelContext): Promise<R>;
}

export type OpRegistry = Readonly<Record<string, Op<any, any>>>;

export function defineOps<T extends Record<string, Op<any, any>>>(ops: T): Readonly<T> {
  return Object.freeze({ ...ops });
}

export type OpParams<O> = O extends Op<infer P, any> ? P : never;
export type OpResult<O> = O extends Op<any, infer R> ? R : never;

export type LinkDriver<Ops extends OpRegistry> = {
  [K in keyof Ops]: OpParams<Ops[K]> extends void
    ? () => Promise<OpResult<Ops[K]>>
    : (params: OpParams<Ops[K]>) => Promise<OpResult<Ops[K]>>;
};

export interface LinkSnapshot {
  readonly model: string;
  readonly thinking: ThinkingLevel;
  readonly streaming: boolean;
  readonly condensing: boolean;
  readonly faulted: boolean;
  readonly sessionId: string;
  readonly sessionFile?: string;
  readonly autoCondense: boolean;
  readonly messageCount: number;
  readonly queuedCount: number;
  readonly usage: Usage;
}

export interface Signal {
  readonly type: "signal";
  readonly name: string;
  readonly body: unknown;
}

export type OneshotShape = "text" | "ndjson";

export interface OneshotRequest {
  readonly shape: OneshotShape;
  readonly prompts: readonly string[];
  readonly images?: readonly ImageContent[];
}

export interface OneshotStrategy {
  onStart?(ctx: ChannelContext): void | Promise<void>;
  onSignal?(signal: unknown, ctx: ChannelContext): void;
  finish(state: ConductorState, ctx: ChannelContext): number | Promise<number>;
}

export const REQUEST_ID_PREFIX = "lnk-";

export interface ChannelTimings {
  readonly startupMs: number;
  readonly shutdownMs: number;
  readonly requestMs: number;
  readonly dialogMs: number;
}

export const DEFAULT_CHANNEL_TIMINGS: ChannelTimings = Object.freeze({
  startupMs: 1500,
  shutdownMs: 1200,
  requestMs: 45_000,
  dialogMs: 90_000,
});

export interface DriverOptions {
  readonly out?: WritableLine;
  readonly in?: ReadableChunks;
  readonly timings?: Partial<ChannelTimings>;
  readonly framer?: NdjsonFramer;
  readonly onSignal?: (signal: Signal) => void;
  readonly onAsk?: (ask: Ask) => Promise<unknown>;
}

export interface ServerOptions {
  readonly in?: ReadableChunks;
  readonly out?: WritableLine;
  readonly timings?: Partial<ChannelTimings>;
  readonly framer?: NdjsonFramer;
}