/**
 * `indusagi-cli` bridge — drives a peer agent over JSON-RPC.
 */
import type {
  Context,
  ExchangeOptions,
  ExternalRuntimeSpec,
  RuntimeAdapterId,
  RuntimeBridge,
  ToolCall,
} from "../contract.js";
import {
  asRecord,
  driveExchange,
  strField,
  type ChildParser,
} from "./_drive.js";

const ADAPTER: RuntimeAdapterId = "indusagi-cli";
const RPC_METHOD = "runExchange";
const CONTINUE = { status: "continue" } as const;
const DONE = { status: "done" } as const;

function asFinishReason(raw: string | undefined): "stop" | "length" | "toolUse" {
  const allowed = ["stop", "length", "toolUse"];
  return (allowed as string[]).includes(raw ?? "") ? (raw as "stop" | "length" | "toolUse") : "stop";
}

function toolCallFromParams(params: Record<string, unknown> | undefined): ToolCall | undefined {
  const id = params && strField(params, "id");
  const name = params && strField(params, "name");
  if (id === undefined || name === undefined) return undefined;
  return {
    type: "toolCall",
    id,
    name,
    arguments: (params && asRecord(params["arguments"])) ?? {},
  };
}

interface NotificationSink {
  text: (delta: string) => void;
  thinking: (delta: string) => void;
  toolCall: (call: ToolCall) => void;
  emit: (event: { kind: "resume"; resumeToken: string }) => void;
  finishSuccess: (reason: "stop" | "length" | "toolUse") => void;
  finishError: (error: { message: string; aborted: boolean; cause?: unknown }) => void;
}

function handleNotification(
  method: string,
  params: Record<string, unknown> | undefined,
  sink: NotificationSink,
): { status: "continue" | "done" } {
  switch (method) {
    case "stream/text": {
      const delta = params && strField(params, "delta");
      if (delta !== undefined) sink.text(delta);
      return CONTINUE;
    }
    case "stream/thinking": {
      const delta = params && strField(params, "delta");
      if (delta !== undefined) sink.thinking(delta);
      return CONTINUE;
    }
    case "stream/toolCall": {
      const call = toolCallFromParams(params);
      if (call) sink.toolCall(call);
      return CONTINUE;
    }
    case "session/resume": {
      const token = params && strField(params, "resumeToken");
      if (token !== undefined) sink.emit({ kind: "resume", resumeToken: token });
      return CONTINUE;
    }
    case "stream/done": {
      sink.finishSuccess(asFinishReason(params ? strField(params, "reason") : undefined));
      return DONE;
    }
    case "stream/error": {
      const message = (params && strField(params, "message")) ?? "indusagi-cli error";
      const aborted = params?.["aborted"] === true;
      sink.finishError({ message, aborted, cause: params });
      return DONE;
    }
    default:
      return CONTINUE;
  }
}

function parseFrame(message: { payload: unknown }, sink: {
  text: (delta: string) => void;
  thinking: (delta: string) => void;
  toolCall: (call: ToolCall) => void;
  emit: (event: { kind: "resume"; resumeToken: string }) => void;
  finishSuccess: (reason: "stop" | "length" | "toolUse") => void;
  finishError: (error: { message: string; aborted: boolean; cause?: unknown }) => void;
}): { status: "continue" | "done" } {
  const frame = asRecord(message.payload);
  if (!frame) return CONTINUE;
  const method = strField(frame, "method");
  if (method !== undefined) {
    return handleNotification(method, asRecord(frame["params"]), sink);
  }
  if ("error" in frame) {
    const error = asRecord(frame["error"]);
    const detail = (error && strField(error, "message")) ?? "indusagi-cli rpc error";
    sink.finishError({ message: detail, cause: frame["error"] });
    return DONE;
  }
  if ("result" in frame) {
    return DONE;
  }
  return CONTINUE;
}

const parser = parseFrame;

function openingRequest(
  context: Context,
  opts: ExchangeOptions,
  spec: ExternalRuntimeSpec,
): { body: unknown } {
  return {
    body: {
      jsonrpc: "2.0",
      id: opts.sessionId ?? RPC_METHOD,
      method: RPC_METHOD,
      params: {
        context,
        delegate: spec.delegate,
        resume: opts.resume,
        cwd: opts.cwd,
        sessionId: opts.sessionId,
      },
    },
  };
}

export function makeIndusagiCliBridge(spec: ExternalRuntimeSpec): RuntimeBridge {
  return {
    adapter: ADAPTER,
    runExchange(model, context, opts, transport) {
      return driveExchange(model, opts, transport, openingRequest(context, opts, spec), parser);
    },
    requiresCredential(s: ExternalRuntimeSpec): boolean {
      return s.authMode === "api-key";
    },
  };
}

export const indusagiCliBridge: RuntimeBridge = makeIndusagiCliBridge({
  adapter: ADAPTER,
  authMode: "external-cli",
});