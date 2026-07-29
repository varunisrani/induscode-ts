/**
 * Shared exchange driver — the transport-wiring half every bridge reuses.
 */
import type {
  Api,
  AssistantMessageEventStream,
  BridgeEventSink,
  ChildMessage,
  ChildRequest,
  ChildTransport,
  ExchangeOptions,
  Model,
} from "../contract.js";
import { createBridgeSink, type BridgeMessageSeed } from "../sink.js";

export type ParseStep = { readonly status: "continue" } | { readonly status: "done" };

export type ChildParser = (message: ChildMessage, sink: BridgeEventSink) => ParseStep;

export function seedFromModel(model: Model<Api>): BridgeMessageSeed {
  return { api: model.api, provider: model.provider, model: model.id };
}

export function errorText(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === "string") return cause;
  return "external runtime error";
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

export function strField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

export function driveExchange(
  model: Model<Api>,
  opts: ExchangeOptions,
  transport: ChildTransport,
  request: ChildRequest,
  parse: ChildParser,
): AssistantMessageEventStream {
  const sink = createBridgeSink(seedFromModel(model));
  let finished = false;
  let unsubscribe: (() => void) | undefined;

  const teardown = (): void => {
    unsubscribe?.();
    unsubscribe = undefined;
    void transport.close().catch(() => undefined);
  };

  const settleSuccess = (): void => {
    if (finished) return;
    finished = true;
    sink.finishSuccess();
    teardown();
  };

  const settleError = (message: string, aborted: boolean, cause?: unknown): void => {
    if (finished) return;
    finished = true;
    sink.finishError({ message, aborted, cause });
    teardown();
  };

  const signal = opts.signal;
  if (signal) {
    if (signal.aborted) {
      queueMicrotask(() => settleError("exchange aborted", true));
      return sink.stream;
    }
    signal.addEventListener("abort", () => settleError("exchange aborted", true), { once: true });
  }

  unsubscribe = transport.onMessage((message) => {
    if (finished) return;
    try {
      const step = parse(message, sink);
      if (step.status === "done") settleSuccess();
    } catch (cause) {
      settleError(errorText(cause), false, cause);
    }
  });

  void transport.send(request).catch((cause) => {
    settleError(errorText(cause), false, cause);
  });

  return sink.stream;
}