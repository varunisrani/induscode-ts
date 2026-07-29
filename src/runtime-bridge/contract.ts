/**
 * Runtime-bridge contract — the FROZEN type surface of provider *routing*.
 */
import type {
  Api,
  AssistantMessage,
  AssistantMessageEventStream,
  Context,
  KnownProvider,
  Model,
  SimpleStreamOptions,
  StopReason,
  ToolCall,
} from "indusagi/ai";

export type {
  Api,
  AssistantMessage,
  AssistantMessageEventStream,
  Context,
  KnownProvider,
  Model,
  SimpleStreamOptions,
  StopReason,
  ToolCall,
};

export type RuntimeAdapterId = "claude-cli" | "codex-cli" | "indusagi-cli" | (string & {});

export type RuntimeAuthMode = "external-cli" | "api-key";

export interface ExternalRuntimeSpec {
  readonly adapter: RuntimeAdapterId;
  readonly authMode: RuntimeAuthMode;
  readonly binaryPath?: string;
  readonly args?: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
  readonly delegate?: string;
}

export const RUNTIME_ENDPOINT_SCHEME = "bridge:" as const;
export type RuntimeEndpointScheme = typeof RUNTIME_ENDPOINT_SCHEME;

export function runtimeEndpoint(adapter: RuntimeAdapterId): string {
  return `${RUNTIME_ENDPOINT_SCHEME}${adapter}`;
}

export type NormalizedEvent =
  | { readonly kind: "text"; readonly delta: string }
  | { readonly kind: "thinking"; readonly delta: string }
  | { readonly kind: "tool_call"; readonly call: ToolCall }
  | { readonly kind: "resume"; readonly resumeToken: string }
  | { readonly kind: "finish"; readonly reason: FinishReason }
  | { readonly kind: "failed"; readonly error: BridgeFailure };

export type NormalizedEventKind = NormalizedEvent["kind"];

export type NormalizedEventOf<K extends NormalizedEventKind> = Extract<
  NormalizedEvent,
  { kind: K }
>;

export type FinishReason = Extract<StopReason, "stop" | "length" | "toolUse">;

export interface BridgeFailure {
  readonly message: string;
  readonly aborted?: boolean;
  readonly cause?: unknown;
}

export interface BridgeEventSink {
  start(): void;
  text(delta: string): void;
  thinking(delta: string): void;
  toolCall(call: ToolCall): void;
  emit(event: NormalizedEvent): void;
  finishSuccess(reason?: FinishReason): void;
  finishError(error: BridgeFailure): void;
  readonly stream: AssistantMessageEventStream;
}

export interface ChildMessage {
  readonly payload: unknown;
}

export interface ChildRequest {
  readonly body: unknown;
}

export interface ChildTransport {
  send(request: ChildRequest): Promise<void>;
  onMessage(listener: (message: ChildMessage) => void): () => void;
  close(): Promise<void>;
}

export interface ExchangeOptions extends SimpleStreamOptions {
  readonly sessionId?: string;
  readonly cwd?: string;
  readonly resume?: string;
}

export interface RuntimeBridge {
  readonly adapter: RuntimeAdapterId;
  runExchange(
    model: Model<Api>,
    context: Context,
    opts: ExchangeOptions,
    transport: ChildTransport,
  ): AssistantMessageEventStream;
  requiresCredential(spec: ExternalRuntimeSpec): boolean;
}

export type RuntimeRoute =
  | { readonly target: "external"; readonly bridge: RuntimeBridge; readonly spec: ExternalRuntimeSpec }
  | { readonly target: "framework" };

export interface RuntimeBroker {
  register(bridge: RuntimeBridge): void;
  route(model: Model<Api>, context: Context, opts: ExchangeOptions): RuntimeRoute;
  resolveSpec(model: Model<Api>): ExternalRuntimeSpec | undefined;
  requiresCredential(spec: ExternalRuntimeSpec): boolean;
}