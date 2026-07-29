/**
 * Addon sandbox — the SINGLE jiti-backed {@link ModuleLoader}.
 *
 * This module turns a path on disk into a loaded {@link AddonManifest}.
 */
import { createJiti } from "jiti";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as agentNamespace from "indusagi/agent";
import * as aiNamespace from "indusagi/ai";
import * as tuiNamespace from "indusagi/tui";
import { isPackagedBinary } from "../workspace/runtime-detect.js";
import type {
  AddonManifest,
  BundledNamespace,
  ModuleLoader,
} from "./contract.js";
import { BUNDLED_NAMESPACES } from "./contract.js";

const NAMESPACE_OBJECTS: Readonly<Record<BundledNamespace, unknown>> = {
  "indusagi/agent": agentNamespace,
  "indusagi/ai": aiNamespace,
  "indusagi/tui": tuiNamespace,
  "@sinclair/typebox": {},
};

const INVISIBLE_CODE_POINTS: readonly number[] = [
  160, 8203, 8204, 8205, 8206, 8207, 8288, 65279, 8239, 8287, 12288,
  8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202,
];

const INVISIBLE_SET = new Set<number>(INVISIBLE_CODE_POINTS);

export function scrubInvisible(raw: string): string {
  let out = "";
  for (const char of raw) {
    const code = char.codePointAt(0);
    if (code !== undefined && INVISIBLE_SET.has(code)) {
      continue;
    }
    out += char;
  }
  return out.trim();
}

export function expandPath(raw: string, home: string = homedir()): string {
  const cleaned = scrubInvisible(raw);
  if (cleaned === "~") {
    return home;
  }
  if (cleaned.startsWith("~/") || cleaned.startsWith("~\\")) {
    return home + cleaned.slice(1);
  }
  return cleaned;
}

export function resolvePath(
  raw: string,
  base: string = process.cwd(),
  home: string = homedir(),
): string {
  const expanded = expandPath(raw, home);
  return isAbsolute(expanded) ? resolve(expanded) : resolve(base, expanded);
}

function buildVirtualModules(): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  for (const specifier of BUNDLED_NAMESPACES) {
    map[specifier] = NAMESPACE_OBJECTS[specifier];
  }
  return map;
}

function resolveSpecifierPath(specifier: string): string | undefined {
  try {
    const resolved = import.meta.resolve(specifier);
    return resolved.startsWith("file:") ? fileURLToPath(resolved) : resolved;
  } catch {
    return undefined;
  }
}

function buildAliasMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const specifier of BUNDLED_NAMESPACES) {
    const path = resolveSpecifierPath(specifier);
    if (path !== undefined) {
      map[specifier] = path;
    }
  }
  return map;
}

interface JitiOptions {
  moduleCache?: boolean;
  virtualModules?: Record<string, unknown>;
  alias?: Record<string, string>;
  tryNative?: boolean;
}

function jitiOptionsForRuntime(): JitiOptions {
  const base = { moduleCache: false };
  if (isPackagedBinary()) {
    return { ...base, virtualModules: buildVirtualModules(), tryNative: false };
  }
  return { ...base, alias: buildAliasMap() };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickManifestObject(imported: unknown): Record<string, unknown> | undefined {
  if (!isObject(imported)) {
    return undefined;
  }
  const direct = imported;
  if (typeof direct.register === "function") {
    return imported;
  }
  const fallback = imported.default;
  return isObject(fallback) ? fallback : imported;
}

function toManifest(imported: unknown): AddonManifest | undefined {
  const candidate = pickManifestObject(imported);
  if (candidate === undefined) {
    return undefined;
  }
  const register = candidate.register;
  if (typeof register !== "function") {
    return undefined;
  }
  const id = candidate.id;
  const version = candidate.version;
  return {
    register: register.bind(candidate),
    ...(typeof id === "string" ? { id } : {}),
    ...(typeof version === "string" ? { version } : {}),
  };
}

export interface JitiLoaderOptions {
  readonly base?: string;
  readonly home?: string;
}

/**
 * Construct the default jiti-backed {@link ModuleLoader}.
 */
export function createJitiLoader(options: JitiLoaderOptions = {}): ModuleLoader {
  const jiti = createJiti(import.meta.url, jitiOptionsForRuntime() as Parameters<typeof createJiti>[1]);
  const base = options.base ?? process.cwd();
  const home = options.home ?? homedir();
  return {
    async load(path: string): Promise<AddonManifest> {
      const absolute = resolvePath(path, base, home);
      const specifier = pathToFileURL(absolute).href;
      const imported = (await jiti.import(specifier)) as unknown;
      const manifest = toManifest(imported);
      if (manifest === undefined) {
        throw new Error(
          `addon at ${absolute} does not export a register() entry point`,
        );
      }
      return manifest;
    },
  };
}