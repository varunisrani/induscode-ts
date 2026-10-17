/**
 * Resolve Sarvam MCP config from flags / env / config files.
 *
 * Precedence (high → low):
 *   1. explicit apiKey argument
 *   2. --sarvam-key
 *   3. SARVAM_API_KEY env
 *   4. project .indusagi/sarvam.json (enabled + basePath; key still from env preferred)
 *   5. profile ~/.indusagi/agent/sarvam.json
 *
 * Non-secret fields (basePath, baseUrl, enabled) come from files; API keys
 * prefer env / CLI to avoid committing secrets.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { SarvamHostConfig } from "./types.js";
import { atomicWritePrivateFileSync, readPrivateFileSync } from "../../security/private-state.js";

const ENV_KEY = "SARVAM_API_KEY";
const ENV_DISABLE = "SARVAM_DISABLED";
const ENV_BASE_URL = "SARVAM_API_BASE_URL";
const ENV_BASE_PATH = "SARVAM_MCP_BASE_PATH";

function readJsonFile(path: string, sensitive = false): Record<string, unknown> | undefined {
  try {
    if (!sensitive && !existsSync(path)) return undefined;
    const raw = sensitive ? readPrivateFileSync(path) : readFileSync(path, "utf8");
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function configFromRecord(rec: Record<string, unknown> | undefined, includeApiKey = true): SarvamHostConfig | undefined {
  if (!rec) return undefined;
  const enabled = rec.enabled === false ? false : true;
  const id = typeof rec.id === "string" && rec.id.trim() ? rec.id.trim() : "sarvam";
  const apiKey = includeApiKey && typeof rec.apiKey === "string" ? rec.apiKey.trim() : undefined;
  const baseUrl = typeof rec.baseUrl === "string" ? rec.baseUrl.trim() : undefined;
  const basePath = typeof rec.basePath === "string" ? rec.basePath.trim() : undefined;
  const command = typeof rec.command === "string" ? rec.command.trim() : undefined;
  // File alone without key is still useful when env has SARVAM_API_KEY
  return {
    id,
    enabled,
    ...(apiKey ? { apiKey } : {}),
    ...(baseUrl ? { baseUrl } : {}),
    ...(basePath ? { basePath } : {}),
    ...(command ? { command } : {}),
  };
}

/** Profile path: ~/.indusagi/agent/sarvam.json */
export function profileSarvamPath(home = homedir()): string {
  return join(home, ".indusagi", "agent", "sarvam.json");
}

/** Project path: <cwd>/.indusagi/sarvam.json */
export function projectSarvamPath(cwd: string): string {
  return join(cwd, ".indusagi", "sarvam.json");
}

/**
 * Save non-secret Sarvam prefs. Does not write apiKey unless explicitly present
 * on config (prefer env for secrets).
 */
export function saveSarvamConfig(
  config: SarvamHostConfig,
  where: "profile" | "project" = "profile",
  cwd = process.cwd(),
  home = homedir(),
): string {
  const path = where === "project" ? projectSarvamPath(cwd) : profileSarvamPath(home);
  const body: Record<string, unknown> = {
    id: config.id ?? "sarvam",
    enabled: config.enabled !== false,
  };
  if (config.basePath) body.basePath = config.basePath;
  if (config.baseUrl) body.baseUrl = config.baseUrl;
  if (config.command) body.command = config.command;
  // Only persist key if caller intentionally set it (e.g. interactive connect with key arg).
  if (where === "profile" && config.apiKey) body.apiKey = config.apiKey;
  atomicWritePrivateFileSync(path, JSON.stringify(body, null, 2) + "\n");
  return path;
}

export interface ResolveSarvamOptions {
  /** Explicit API key (e.g. from --sarvam-key). */
  apiKey?: string;
  /** Force disable (--no-sarvam). */
  disabled?: boolean;
  /** Force enable when key present (--sarvam). */
  forceEnable?: boolean;
  basePath?: string;
  baseUrl?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Override home for profile path (tests). */
  home?: string;
}

/**
 * Resolve effective Sarvam config or undefined if Sarvam should not attach.
 * Requires a resolvable API key (arg, env, or file).
 */
export function resolveSarvamConfig(opts: ResolveSarvamOptions = {}): SarvamHostConfig | undefined {
  const env = opts.env ?? process.env;
  const cwd = opts.cwd ?? process.cwd();

  if (opts.disabled || env[ENV_DISABLE] === "1" || env[ENV_DISABLE] === "true") {
    return undefined;
  }

  const fromArgKey = opts.apiKey?.trim();
  const fromEnvKey = env[ENV_KEY]?.trim();
  const fromProject = configFromRecord(readJsonFile(projectSarvamPath(cwd)), false);
  const fromProfile = configFromRecord(
    readJsonFile(profileSarvamPath(opts.home ?? homedir()), true),
  );

  const fileBase = fromProject ?? fromProfile;
  const apiKey = fromArgKey || fromEnvKey || fileBase?.apiKey;
  if (!apiKey) {
    // No key → only attach if forceEnable is false and we still want to signal "off"
    return undefined;
  }

  if (fileBase?.enabled === false && !opts.forceEnable) {
    return undefined;
  }

  return {
    apiKey,
    id: fileBase?.id ?? "sarvam",
    enabled: true,
    baseUrl:
      opts.baseUrl?.trim() ||
      env[ENV_BASE_URL]?.trim() ||
      fileBase?.baseUrl,
    basePath:
      opts.basePath?.trim() ||
      env[ENV_BASE_PATH]?.trim() ||
      fileBase?.basePath,
    command: fileBase?.command,
  };
}

export function redactApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
