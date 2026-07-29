/**
 * Package command — `runPackageCommand`.
 *
 * The top-level `install` / `remove` / `update` / `list` / `config` surface that
 * manages the extension-package sources the launcher loads.
 */
import type { PreferenceStore } from "../settings/index.js";

export type PackageCommand = "install" | "remove" | "update" | "list" | "config";

export const PACKAGE_COMMANDS: readonly PackageCommand[] = [
  "install",
  "remove",
  "update",
  "list",
  "config",
];

export interface PackageIo {
  print(line: string): void;
  printError(line: string): void;
}

export function defaultPackageIo(): PackageIo {
  return {
    print(line: string): void {
      process.stdout.write(line.endsWith("\n") ? line : `${line}\n`);
    },
    printError(line: string): void {
      process.stderr.write(line.endsWith("\n") ? line : `${line}\n`);
    },
  };
}

export interface PackageCommandOptions {
  readonly store: PreferenceStore;
  readonly io?: PackageIo;
}

export interface PackageResult {
  readonly handled: boolean;
  readonly command?: PackageCommand;
  readonly code?: number;
}

const PACKAGES_KEY = "extensionPackages";

function asPackageCommand(token: string | undefined): PackageCommand | undefined {
  return token !== undefined && (PACKAGE_COMMANDS as readonly string[]).includes(token)
    ? (token as PackageCommand)
    : undefined;
}

function sourceKey(source: string): string {
  const trimmed = source.trim();
  if (trimmed.startsWith("npm:")) {
    const spec = trimmed.slice("npm:".length);
    const at = spec.lastIndexOf("@");
    const name = at > 0 ? spec.slice(0, at) : spec;
    return `npm:${name}`;
  }
  const gitlike =
    trimmed.startsWith("git:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://");
  if (gitlike) {
    const withoutScheme = trimmed.replace(/^git:/, "").replace(/^https?:\/\//, "");
    const withoutVersion = withoutScheme.split("@")[0] ?? withoutScheme;
    return `git:${withoutVersion.replace(/\.git$/, "")}`;
  }
  return `local:${trimmed}`;
}

function sourcesMatch(a: string, b: string): boolean {
  return sourceKey(a) === sourceKey(b);
}

function readSources(store: PreferenceStore): string[] {
  const value = store.get(PACKAGES_KEY);
  return Array.isArray(value) ? [...value] : [];
}

function writeSources(store: PreferenceStore, sources: string[]): void {
  store.set(PACKAGES_KEY, sources);
  store.save();
}

function readSource(rest: readonly string[]): string | undefined {
  return rest.find((token) => !token.startsWith("-"));
}

function doInstall(
  rest: readonly string[],
  store: PreferenceStore,
  io: PackageIo,
): PackageResult {
  const source = readSource(rest);
  if (source === undefined) {
    io.printError(
      "install: a package source is required (npm:, git:, https:, or a local path).",
    );
    return { handled: true, command: "install", code: 1 };
  }
  const sources = readSources(store);
  if (sources.some((existing) => sourcesMatch(existing, source))) {
    io.print(`Already installed: ${source}`);
    return { handled: true, command: "install", code: 0 };
  }
  writeSources(store, [...sources, source]);
  io.print(`Installed ${source}`);
  return { handled: true, command: "install", code: 0 };
}

function doRemove(
  rest: readonly string[],
  store: PreferenceStore,
  io: PackageIo,
): PackageResult {
  const source = readSource(rest);
  if (source === undefined) {
    io.printError("remove: a package source is required.");
    return { handled: true, command: "remove", code: 1 };
  }
  const sources = readSources(store);
  const next = sources.filter((existing) => !sourcesMatch(existing, source));
  if (next.length === sources.length) {
    io.printError(`remove: not installed: ${source}`);
    return { handled: true, command: "remove", code: 1 };
  }
  writeSources(store, next);
  io.print(`Removed ${source}`);
  return { handled: true, command: "remove", code: 0 };
}

function doUpdate(store: PreferenceStore, io: PackageIo): PackageResult {
  store.reload();
  const sources = readSources(store);
  if (sources.length === 0) {
    io.print("No packages to update.");
    return { handled: true, command: "update", code: 0 };
  }
  io.print(`Refreshed ${sources.length} package source${sources.length === 1 ? "" : "s"}.`);
  for (const source of sources) {
    io.print(`  ${source}`);
  }
  return { handled: true, command: "update", code: 0 };
}

function doList(store: PreferenceStore, io: PackageIo): PackageResult {
  const sources = readSources(store);
  if (sources.length === 0) {
    io.print("No packages installed.");
    return { handled: true, command: "list", code: 0 };
  }
  io.print("Installed packages:");
  for (const source of sources) {
    io.print(`  ${source}`);
  }
  return { handled: true, command: "list", code: 0 };
}

function doConfig(store: PreferenceStore, io: PackageIo): PackageResult {
  const locations = store.paths();
  io.print(`Global settings: ${locations.global}`);
  io.print(`Project settings: ${locations.project}`);
  io.print("Resolved settings:");
  io.print(JSON.stringify(store.snapshot(), null, 2));
  return { handled: true, command: "config", code: 0 };
}

/**
 * Run the package command.
 */
export async function runPackageCommand(
  argv: readonly string[],
  opts: PackageCommandOptions,
): Promise<PackageResult> {
  const command = asPackageCommand(argv[0]);
  if (command === undefined) return { handled: false };
  const io = opts.io ?? defaultPackageIo();
  const rest = argv.slice(1);
  switch (command) {
    case "install":
      return doInstall(rest, opts.store, io);
    case "remove":
      return doRemove(rest, opts.store, io);
    case "update":
      return doUpdate(opts.store, io);
    case "list":
      return doList(opts.store, io);
    case "config":
      return doConfig(opts.store, io);
  }
}