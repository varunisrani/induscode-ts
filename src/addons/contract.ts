/**
 * Addons contract — the FROZEN type surface of the third-party customization
 * layer.
 *
 * This module is the single typed seam between the coding-agent *product* and
 * code that does not ship with it.
 */
import type { AgentMessage, AgentTool, AgentToolResult, ThinkingLevel } from "indusagi/agent";
import type { Model } from "indusagi/ai";
import type { Component, KeyId } from "indusagi/tui";
import type { Static, TSchema } from "@sinclair/typebox";

export type {
  AgentMessage,
  AgentTool,
  AgentToolResult,
  ThinkingLevel,
  Model,
  Component,
  KeyId,
  TSchema,
  Static,
};

export type BundledNamespace =
  | "indusagi/agent"
  | "indusagi/ai"
  | "indusagi/tui"
  | "@sinclair/typebox";

export const BUNDLED_NAMESPACES: readonly BundledNamespace[] = [
  "indusagi/agent",
  "indusagi/ai",
  "indusagi/tui",
  "@sinclair/typebox",
];

export type AddonId = string & { readonly __addon: unique symbol };

export function addonId(raw: string): AddonId {
  return raw as AddonId;
}

export interface AddonManifest {
  readonly id?: string;
  readonly version?: string;
  register(surface: AddonSurface): void | Promise<void>;
}

export interface RegisteredManifest {
  readonly addon: AddonId;
  readonly version?: string;
  readonly subscriptions: readonly EventSubscription[];
  readonly interceptors: readonly ToolInterceptor[];
  readonly commands: readonly AddonCommand[];
  readonly tools: readonly AddonTool[];
}

export function emptyManifest(addon: AddonId, version?: string): RegisteredManifest {
  return version === undefined
    ? { addon, subscriptions: [], interceptors: [], commands: [], tools: [] }
    : { addon, version, subscriptions: [], interceptors: [], commands: [], tools: [] };
}

export type HookEvent =
  | "session:start"
  | "session:end"
  | "turn:start"
  | "turn:end"
  | "tool:before"
  | "tool:after"
  | "chat:params"
  | "chat:message"
  | "shell:env"
  | "input:submit"
  | "context:build"
  | "compact:build"
  | "compact:before";

export type HookKind = "observe" | "transform" | "gate";

export interface GateDecision {
  readonly stop: boolean;
  readonly reason?: string;
}

export type HookHandler<TPayload = unknown> =
  | { readonly kind: "observe"; run(payload: TPayload): void | Promise<void> }
  | { readonly kind: "transform"; run(payload: TPayload): TPayload | Promise<TPayload> }
  | {
      readonly kind: "gate";
      run(payload: TPayload): GateDecision | void | Promise<GateDecision | void>;
    };

export interface EventSubscription {
  readonly event: HookEvent;
  readonly handler: HookHandler;
  readonly addon: AddonId;
}

export interface DispatchOutcome<TPayload> {
  readonly payload: TPayload;
  readonly gate?: GateDecision;
}

export interface EventDispatcher {
  dispatch<TPayload>(event: HookEvent, payload: TPayload): Promise<DispatchOutcome<TPayload>>;
  has(event: HookEvent): boolean;
  onFault(listener: AddonFaultListener): () => void;
}

export interface ToolEnterContext {
  readonly tool: string;
  readonly callId: string;
  readonly args: Readonly<Record<string, unknown>>;
}

export interface ToolExitContext {
  readonly tool: string;
  readonly callId: string;
  readonly result?: AgentToolResult<unknown>;
  readonly error?: unknown;
}

export type EnterOutcome =
  | void
  | { readonly args: Readonly<Record<string, unknown>> }
  | GateDecision;

export type ExitOutcome = void | AgentToolResult<unknown>;

export interface ToolInterceptor {
  readonly match: string | "*";
  readonly addon: AddonId;
  enter?(ctx: ToolEnterContext): EnterOutcome | Promise<EnterOutcome>;
  exit?(ctx: ToolExitContext): ExitOutcome | Promise<ExitOutcome>;
}

export interface InterceptResult {
  readonly result?: AgentToolResult<unknown>;
  readonly blocked?: GateDecision;
}

export interface InterceptorChain {
  run(
    ctx: ToolEnterContext,
    execute: (args: Readonly<Record<string, unknown>>) => Promise<AgentToolResult<unknown>>,
  ): Promise<InterceptResult>;
  matches(tool: string): boolean;
}

export type AddonTool<TParameters extends TSchema = TSchema, TDetails = unknown> = AgentTool<
  TParameters,
  TDetails
>;

export interface CommandContext {
  readonly args: string;
  readonly cwd: string;
  readonly handles: FrameworkHandles;
}

export interface AddonCommand {
  readonly name: string;
  readonly summary: string;
  readonly addon: AddonId;
  run(ctx: CommandContext): void | Promise<void>;
}

export interface ExecOutcome {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number | null;
}

export interface FrameworkHandles {
  readonly sendMessage?: (text: string) => void | Promise<void>;
  readonly setModel?: (id: string) => void | Promise<void>;
  readonly setThinking?: (level: ThinkingLevel) => void;
  readonly render?: (component: Component) => void;
  readonly exec?: (command: string) => Promise<ExecOutcome>;
}

export interface AddonSurface {
  readonly id: AddonId;
  on<TPayload>(event: HookEvent, handler: HookHandler<TPayload>): void;
  interceptTool(name: string | "*", interceptor: Omit<ToolInterceptor, "match" | "addon">): void;
  addCommand(name: string, handler: Omit<AddonCommand, "name" | "addon">): void;
  addTool(card: AddonTool): void;
  readonly handles: FrameworkHandles;
  manifest(): RegisteredManifest;
}

export interface ModuleLoader {
  load(path: string): Promise<AddonManifest>;
}

export interface AddonDiscovery {
  readonly workspace?: string;
  readonly dir?: string;
  readonly explicitPaths?: readonly string[];
}

export const ADDONS_DIR = ".indus/addons" as const;
export const ADDON_MANIFEST_FIELD = "indusAddon" as const;

export interface AddonSource {
  readonly id: AddonId;
  readonly path: string;
}

export type AddonFaultKind = "load" | "register" | "handler" | "command" | "conflict";

export interface AddonFault {
  readonly kind: AddonFaultKind;
  readonly message: string;
  readonly addon?: AddonId;
  readonly cause?: unknown;
}

export type AddonFaultListener = (fault: AddonFault) => void;

export function addonFault(
  kind: AddonFaultKind,
  message: string,
  detail?: { addon?: AddonId; cause?: unknown },
): AddonFault {
  const fault = { kind, message };
  const addon = detail?.addon;
  const cause = detail?.cause;
  return {
    ...fault,
    ...(addon !== undefined ? { addon } : {}),
    ...(cause !== undefined ? { cause } : {}),
  };
}