/**
 * Addon discovery — scanning a workspace for addon entry modules.
 *
 * Where the sandbox module answers "how do I load *this* path", this module
 * answers "*which* paths are there to load".
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import {
  ADDON_MANIFEST_FIELD,
  ADDONS_DIR,
  addonId,
  type AddonDiscovery,
  type AddonSource,
} from "./contract.js";

const ENTRY_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".cjs",
];

const INDEX_BASENAMES = ["index"];

function isHidden(name: string): boolean {
  return name.startsWith(".");
}

function hasEntryExtension(name: string): boolean {
  return (ENTRY_EXTENSIONS as readonly string[]).includes(extname(name).toLowerCase());
}

function entryKind(path: string): "directory" | "file" | undefined {
  try {
    const stat = statSync(path);
    if (stat.isDirectory()) return "directory";
    if (stat.isFile()) return "file";
    return undefined;
  } catch {
    return undefined;
  }
}

function listNames(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function readManifestEntry(packageDir: string): string | undefined {
  const manifestPath = join(packageDir, "package.json");
  if (entryKind(manifestPath) !== "file") {
    return undefined;
  }
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) {
      return undefined;
    }
    const field = parsed[ADDON_MANIFEST_FIELD];
    return typeof field === "string" ? field : undefined;
  } catch {
    return undefined;
  }
}

function resolvePackageEntry(packageDir: string): string | undefined {
  const declared = readManifestEntry(packageDir);
  if (declared !== undefined) {
    const declaredPath = resolve(packageDir, declared);
    if (entryKind(declaredPath) === "file") {
      return declaredPath;
    }
  }
  for (const base of INDEX_BASENAMES) {
    for (const ext of ENTRY_EXTENSIONS) {
      const candidate = join(packageDir, `${base}${ext}`);
      if (entryKind(candidate) === "file") {
        return candidate;
      }
    }
  }
  return undefined;
}

function resolveTopLevelEntry(dir: string, name: string): string | undefined {
  if (isHidden(name)) {
    return undefined;
  }
  const path = join(dir, name);
  const kind = entryKind(path);
  if (kind === "file") {
    return hasEntryExtension(name) ? path : undefined;
  }
  if (kind === "directory") {
    return resolvePackageEntry(path);
  }
  return undefined;
}

/**
 * Scan one addons directory and return the absolute entry-module paths it holds.
 */
export function discoverAddons(dir: string): string[] {
  const entries: string[] = [];
  for (const name of listNames(dir)) {
    const entry = resolveTopLevelEntry(dir, name);
    if (entry !== undefined) {
      entries.push(entry);
    }
  }
  return entries.sort();
}

function deriveAddonId(entryPath: string): string {
  const file = basename(entryPath);
  const stem = file.slice(0, file.length - extname(file).length);
  const label =
    (INDEX_BASENAMES as readonly string[]).includes(stem)
      ? basename(join(entryPath, ".."))
      : stem;
  return addonId(label.length > 0 ? label : entryPath);
}

function addonsDirFor(workspace: string, dir: string = ADDONS_DIR): string {
  return resolve(workspace, dir);
}

/**
 * Fold an {@link AddonDiscovery} config into the ordered, deduplicated list of
 * {@link AddonSource}s.
 */
export function discoverSources(discovery: AddonDiscovery): AddonSource[] {
  const paths: string[] = [];
  if (discovery.workspace !== undefined) {
    const dir = addonsDirFor(discovery.workspace, discovery.dir ?? ADDONS_DIR);
    paths.push(...discoverAddons(dir));
  }
  for (const explicit of discovery.explicitPaths ?? []) {
    paths.push(isAbsolute(explicit) ? explicit : resolve(explicit));
  }
  const seen = new Set<string>();
  const sources: AddonSource[] = [];
  for (const path of paths) {
    if (seen.has(path)) {
      continue;
    }
    seen.add(path);
    sources.push({ id: deriveAddonId(path), path });
  }
  return sources;
}