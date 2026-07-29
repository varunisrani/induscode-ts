/**
 * Settings subsystem — the typed surface of the user-tunable preferences an
 * interactive coding-agent session reads at startup and while it runs.
 */
import type { ThinkingLevel } from "indusagi/agent";

export type { ThinkingLevel };

export type EscapeAction = "tree" | "fork" | "clear" | "rewind" | "branch";

export const ESCAPE_ACTIONS: readonly EscapeAction[] = ["tree", "fork", "clear"];

export function isEscapeAction(value: unknown): value is EscapeAction {
  return typeof value === "string" && (ESCAPE_ACTIONS as readonly string[]).includes(value);
}

export type DeliveryMode = "all" | "one-at-a-time";

export const DELIVERY_MODES: readonly DeliveryMode[] = ["all", "one-at-a-time"];

export function isDeliveryMode(value: unknown): value is DeliveryMode {
  return typeof value === "string" && (DELIVERY_MODES as readonly string[]).includes(value);
}

export type PermissionMode =
  | "default"
  | "acceptEdits"
  | "bypass"
  | "plan"
  | "bypassPermissions";

export const PERMISSION_MODES: readonly PermissionMode[] = [
  "default",
  "acceptEdits",
  "bypass",
  "plan",
];

export function isPermissionMode(value: unknown): value is PermissionMode {
  return (
    value === "default" ||
    value === "acceptEdits" ||
    value === "bypass" ||
    value === "plan" ||
    value === "bypassPermissions"
  );
}

export interface PermissionSettings {
  allow?: string[];
  ask?: string[];
  deny?: string[];
  defaultMode?: PermissionMode;
}

export interface Preferences {
  colourScheme?: string;
  showImages?: boolean;
  showReasoning?: boolean;
  hideThinking?: boolean;
  imageAutoResize?: boolean;
  blockImages?: boolean;
  enableSkillCommands?: boolean;
  steeringMode?: DeliveryMode;
  followUpMode?: DeliveryMode;
  collapseChangelog?: boolean;
  showHardwareCursor?: boolean;
  editorPaddingX?: number;
  enabledModels?: string[];
  defaultProvider?: string;
  defaultModel?: string;
  defaultThinkingLevel?: ThinkingLevel;
  quietStartup?: boolean;
  lastSeenVersion?: string;
  logoSweep?: boolean;
  reducedMotion?: boolean;
  autoCompact?: boolean;
  doubleEscapeAction?: EscapeAction;
  extensionPackages?: string[];
  permissions?: PermissionSettings;
}

export type SettingKey = keyof Preferences;

export const DEFAULT_PREFERENCES: Required<Preferences> = Object.freeze({
  colourScheme: "default",
  showImages: true,
  showReasoning: true,
  hideThinking: false,
  imageAutoResize: true,
  blockImages: false,
  enableSkillCommands: true,
  steeringMode: "all",
  followUpMode: "all",
  collapseChangelog: false,
  showHardwareCursor: false,
  editorPaddingX: 1,
  enabledModels: [],
  defaultProvider: "anthropic",
  defaultModel: "",
  defaultThinkingLevel: "medium",
  quietStartup: false,
  lastSeenVersion: "",
  logoSweep: false,
  reducedMotion: false,
  autoCompact: true,
  doubleEscapeAction: "clear",
  extensionPackages: [],
  permissions: { allow: [], ask: [], deny: [], defaultMode: "default" },
}) as Required<Preferences>;

export const SETTING_KEYS: readonly SettingKey[] = Object.freeze(
  Object.keys(DEFAULT_PREFERENCES) as SettingKey[],
);