/**
 * Workspace Locator — turns the active {@link Brand} plus the environment into a
 * single, fully-resolved {@link Workspace} record of absolute paths.
 */
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import type { Brand, Workspace } from "../boot/contract.js";
import { BRAND } from "./brand.js";
import { ensurePrivateDirectorySync } from "../security/private-state.js";

export interface WorkspaceOverrides {
  /** User home directory; defaults to {@link homedir}. */
  readonly home?: string;
  /** Working directory the resolution is anchored to; defaults to `process.cwd()`. */
  readonly cwd?: string;
  /** Environment to read the profile-dir override from; defaults to {@link process.env}. */
  readonly env?: NodeJS.ProcessEnv;
  /** Brand whose directory names drive the layout; defaults to {@link BRAND}. */
  readonly brand?: Brand;
}

const LAYOUT: Record<keyof Workspace, string[]> = {
  profileDir: [],
  settingsPath: ["settings.json"],
  authPath: ["auth.json"],
  sessionsDir: ["sessions"],
  modelsPath: ["models.json"],
  toolsDir: ["bin"],
  binDir: ["bin"],
  promptsDir: ["prompts"],
  themesDir: ["themes"],
  exportTemplateDir: ["export-template"],
  debugLogPath: ["debug.log"],
  mcpConfigPath: ["mcp-servers.json"],
  memoryConfigPath: ["memory.json"],
  composioConfigPath: ["composio.json"],
  zohoConfigPath: ["zoho.json"],
  memoryDbPath: ["memory.db"],
};

const DIRECTORY_KEYS: Array<keyof Workspace> = [
  "profileDir",
  "sessionsDir",
  "toolsDir",
  "binDir",
  "promptsDir",
  "themesDir",
  "exportTemplateDir",
];

function resolveProfileRoot(
  brand: Brand,
  home: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
): string {
  const override = env[brand.envProfileDir]?.trim();
  if (override) {
    return expandHome(override, home, cwd);
  }
  return join(home, brand.profileDirName, brand.stateDirName);
}

function expandHome(rawPath: string, home: string, cwd: string): string {
  if (rawPath === "~") {
    return home;
  }
  if (rawPath.startsWith("~/") || rawPath.startsWith("~\\")) {
    return join(home, rawPath.slice(2));
  }
  if (isAbsolute(rawPath)) {
    return rawPath;
  }
  return resolve(cwd, rawPath);
}

/**
 * Build the fully-resolved {@link Workspace} for the active brand and
 * environment.
 */
export function createWorkspace(overrides: WorkspaceOverrides = {}): Workspace {
  const brand = overrides.brand ?? BRAND;
  const home = overrides.home ?? homedir();
  const cwd = overrides.cwd ?? process.cwd();
  const env = overrides.env ?? process.env;
  const profileRoot = resolveProfileRoot(brand, home, cwd, env);
  const entries = Object.keys(LAYOUT).map((key) => {
    const segments = LAYOUT[key as keyof Workspace];
    const absolute = segments.length === 0 ? profileRoot : join(profileRoot, ...segments);
    return [key, absolute];
  });
  return Object.freeze(Object.fromEntries(entries)) as Workspace;
}

/**
 * Create every directory the workspace expects, idempotently.
 */
export function ensureDirs(workspace: Workspace): Workspace {
  for (const key of DIRECTORY_KEYS) {
    ensurePrivateDirectorySync(workspace[key]);
  }
  return workspace;
}