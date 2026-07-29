#!/usr/bin/env node
/**
 * Thin executable bootstrap for the indusagi coding agent.
 *
 * The real work lives in the `boot/` subsystem; this file just installs the
 * cross-cutting runtime concerns (process title, MCP log noise filter, heap
 * headroom) and hands control to {@link boot}.
 */
import { argv as processArgv, env as processEnv } from "node:process";
// `process` is a Node.js global; do NOT import it from `node:process` (which
// exports only `argv`, `env`, etc. but not the global `process` itself).
// Use the global directly throughout this file.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BRAND, boot, ensureHeapHeadroom } from "./boot/index.js";

const MCP_NOISE_MARKER = "[MCP]";

function installMcpNoiseFilter(): void {
  const self = installMcpNoiseFilter as { installed?: boolean };
  if (self.installed) return;
  self.installed = true;
  if (processEnv[BRAND.envDebug]) return;
  const carriesMcpNoise = (args: unknown[]): boolean =>
    typeof args[0] === "string" && (args[0] as string).includes(MCP_NOISE_MARKER);
  const wrap =
    (original: (...args: unknown[]) => void) =>
    (...args: unknown[]): void => {
      if (carriesMcpNoise(args)) return;
      (original as (...a: unknown[]) => void)(...args);
    };
  console.log = wrap(console.log.bind(console)) as typeof console.log;
  console.error = wrap(console.error.bind(console)) as typeof console.error;
}

function isProgramEntry(): boolean {
  const entryArg = processArgv[1];
  if (!entryArg) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(entryArg);
  } catch {
    return false;
  }
}

process.title = BRAND.binNames[0];
installMcpNoiseFilter();
if (isProgramEntry()) {
  ensureHeapHeadroom();
  void boot(processArgv.slice(2)).then((code) => {
    process.exitCode = code;
    process.stdout.write("", () => process.exit(code));
    setTimeout(() => process.exit(code), 1e3).unref();
  });
}