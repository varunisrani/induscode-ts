/**
 * Launch contract — the FROZEN type surface of Phase 10 (command-line surface).
 *
 * This module is the single typed seam between a raw `argv` and a fully
 * configured run. It owns the *application* command line: the declarative flag
 * table, the parsed {@link Invocation} those flags fold into, the gathered
 * `@file` {@link Attachments}, and the typed {@link CredentialFault} the
 * api-key sign-in surface raises.
 */
import type { SessionInfo as ResumeRef, SessionListProgress, ThinkingLevel } from "indusagi/agent";
import type { ImageContent, KnownProvider, ModelRegistry, OAuthCredentials } from "indusagi/ai";
import type { Settings } from "indusagi/shell-app";
import type { RunnerId } from "../boot/contract.js";

export type {
  ResumeRef,
  ThinkingLevel,
  SessionListProgress,
  ImageContent,
  KnownProvider,
  ModelRegistry,
  OAuthCredentials,
  Settings,
  RunnerId,
};

export type OutputMode = "text" | "json" | "rpc";

export const THINKING_EFFORTS = [
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const;

export type ThinkingEffort = (typeof THINKING_EFFORTS)[number];

export function isThinkingEffort(value: string): value is ThinkingEffort {
  return (THINKING_EFFORTS as readonly string[]).includes(value);
}

export function isOutputMode(value: string): value is OutputMode {
  return value === "text" || value === "json" || value === "rpc";
}

export const TOOL_NAMES = [
  "read",
  "write",
  "edit",
  "bash",
  "grep",
  "find",
  "ls",
  "task",
  "todo_read",
  "todo_write",
  "web_fetch",
  "web_search",
  "composio",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export function isToolName(value: string): value is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(value);
}

export type FlagKind = "boolean" | "string" | "number" | "list";

export type FlagDefault = boolean | string | number | readonly string[];

export interface FlagSpec {
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly kind: FlagKind;
  readonly describe: string;
  readonly default?: FlagDefault;
}

export interface Invocation {
  readonly mode: OutputMode;
  readonly prompt?: string;
  readonly flags: Record<string, FlagValue>;
  readonly positionals: string[];
  readonly attachments?: Attachments;
  readonly model?: string;
  readonly fallbackModel?: string;
  readonly account?: string;
  readonly cwd?: string;
  readonly system?: string;
  readonly appendSystem?: string;
  readonly thinking?: ThinkingEffort;
  readonly tools?: ToolName[];
  readonly noTools: boolean;
  readonly mcp: string[];
  readonly print: boolean;
  readonly interactive: boolean;
  readonly help: boolean;
  readonly version: boolean;
}

export type FlagValue = boolean | string | number | string[];

export interface Attachments {
  readonly prose: string;
  readonly media: ImageContent[];
}

export interface AttachmentOptions {
  readonly cwd: string;
}

export type CredentialVerb = "signin" | "signout";

export interface ProviderEntry {
  readonly id: KnownProvider | string;
  readonly label: string;
  readonly envKey: string;
  readonly docsUrl: string;
}

export type CredentialFaultKind =
  | "unknown-provider"
  | "invalid-key"
  | "invalid-account"
  | "name-collision"
  | "not-found"
  | "vault"
  | "aborted";

export interface CredentialFault {
  readonly kind: CredentialFaultKind;
  readonly message: string;
  readonly hint?: string;
  readonly cause?: unknown;
}

export function credentialFault(
  kind: CredentialFaultKind,
  message: string,
  extra?: { hint?: string; cause?: unknown },
): CredentialFault {
  return {
    kind,
    message,
    ...(extra?.hint !== undefined ? { hint: extra.hint } : {}),
    ...(extra?.cause !== undefined ? { cause: extra.cause } : {}),
  };
}

export interface AuthVault {
  listAccounts(provider: string): Promise<string[]>;
  defaultAccount(provider: string): Promise<string | undefined>;
  putApiKey(provider: string, account: string, apiKey: string, makeDefault?: boolean): Promise<void>;
  putOAuth(provider: string, account: string, credentials: OAuthCredentials, makeDefault?: boolean): Promise<void>;
  authKind(provider: string, account: string): Promise<"apiKey" | "oauth" | undefined>;
  readUsableKey(provider: string, account: string): Promise<string | undefined>;
  remove(provider: string, account?: string): Promise<boolean>;
}

export interface CredentialCommandOptions {
  readonly vault: AuthVault;
  readonly profileDir: string;
}

export interface CatalogFilter {
  readonly provider?: KnownProvider | string;
  readonly thinkingOnly?: boolean;
  readonly imagesOnly?: boolean;
  readonly search?: string;
}

export type SessionLoader = (onProgress?: SessionListProgress) => Promise<ResumeRef[]>;

export interface ResumeFault {
  readonly message: string;
  readonly cause?: unknown;
}

export interface SettingsBrowseOptions {
  readonly settings: Settings;
  readonly resolvedPaths: Readonly<Record<string, readonly string[]>>;
  readonly cwd: string;
  readonly profileDir: string;
}