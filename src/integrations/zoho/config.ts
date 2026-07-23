/**
 * Resolve Zoho MCP URL from flags / env / config files.
 *
 * Precedence (high → low):
 *   1. explicit url argument
 *   2. --zoho-url / process flags
 *   3. ZOHO_MCP_URL env
 *   4. project .indusagi/zoho.json
 *   5. profile ~/.indusagi/agent/zoho.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { ZohoHostConfig } from "./types.js";

const ENV_URL = "ZOHO_MCP_URL";
const ENV_DISABLE = "ZOHO_DISABLED";

function readJsonFile(path: string): Record<string, unknown> | undefined {
  try {
    if (!existsSync(path)) return undefined;
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function configFromRecord(rec: Record<string, unknown> | undefined): ZohoHostConfig | undefined {
  if (!rec) return undefined;
  const url = typeof rec.url === "string" ? rec.url.trim() : "";
  if (!url) return undefined;
  const enabled = rec.enabled === false ? false : true;
  const id = typeof rec.id === "string" && rec.id.trim() ? rec.id.trim() : "zoho";
  const auth =
    rec.auth === "none" || rec.auth === "oauth" || rec.auth === "auto"
      ? rec.auth
      : "auto";
  return { url, id, enabled, auth };
}

/** Profile path: ~/.indusagi/agent/zoho.json */
export function profileZohoPath(home = homedir()): string {
  return join(home, ".indusagi", "agent", "zoho.json");
}

/** Project path: <cwd>/.indusagi/zoho.json */
export function projectZohoPath(cwd: string): string {
  return join(cwd, ".indusagi", "zoho.json");
}

export function saveZohoConfig(
  config: ZohoHostConfig,
  where: "profile" | "project" = "profile",
  cwd = process.cwd(),
): string {
  const path = where === "project" ? projectZohoPath(cwd) : profileZohoPath();
  mkdirSync(dirname(path), { recursive: true });
  const body = {
    url: config.url,
    id: config.id ?? "zoho",
    enabled: config.enabled !== false,
    auth: config.auth ?? "auto",
  };
  writeFileSync(path, JSON.stringify(body, null, 2) + "\n", "utf8");
  return path;
}

export interface ResolveZohoOptions {
  /** Explicit URL (e.g. from --zoho-url). */
  url?: string;
  /** Force disable (--no-zoho). */
  disabled?: boolean;
  /** Force enable when URL present (--zoho). */
  forceEnable?: boolean;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Override home for profile path (tests). */
  home?: string;
}

/**
 * Resolve effective Zoho config or undefined if Zoho should not attach.
 */
export function resolveZohoConfig(opts: ResolveZohoOptions = {}): ZohoHostConfig | undefined {
  const env = opts.env ?? process.env;
  const cwd = opts.cwd ?? process.cwd();

  if (opts.disabled || env[ENV_DISABLE] === "1" || env[ENV_DISABLE] === "true") {
    return undefined;
  }

  const fromArg = opts.url?.trim();
  const fromEnv = env[ENV_URL]?.trim();
  const fromProject = configFromRecord(readJsonFile(projectZohoPath(cwd)));
  const fromProfile = configFromRecord(
    readJsonFile(profileZohoPath(opts.home ?? homedir())),
  );
  const base =
    (fromArg ? { url: fromArg, id: "zoho", enabled: true, auth: "auto" as const } : undefined) ??
    (fromEnv ? { url: fromEnv, id: "zoho", enabled: true, auth: "auto" as const } : undefined) ??
    fromProject ??
    fromProfile;

  if (!base) return undefined;
  if (base.enabled === false && !opts.forceEnable) return undefined;
  return {
    ...base,
    enabled: true,
  };
}

export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.slice(0, 24)}…`;
  } catch {
    return "(invalid url)";
  }
}
