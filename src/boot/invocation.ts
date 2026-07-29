/**
 * Invocation reader for the boot layer — the adapter that drives the full
 * Phase-10 declarative flag grammar and projects its rich result down onto the
 * thin boot {@link Invocation} the runner pipeline routes on.
 *
 * The parsing itself is no longer owned here. {@link readInvocation} (from the
 * `launch/` subsystem) walks the single declarative flag table and produces the
 * full {@link LaunchInvocation}; this module's job is purely the *projection*:
 * map the launch {@link OutputMode} onto the boot {@link RunnerId}, rename the
 * resolved fields the boot layer reads (`model` → `modelId`, `positionals` →
 * `rest`), and widen the typed flag bag back to the loose
 * `Record<string, unknown>` the boot {@link Invocation} carries. The result is
 * type-compatible with the rest of the boot pipeline, so the runner registry and
 * the session helpers consume it unchanged.
 *
 *   - mode: `text` → `repl`, `json` → `oneshot`, `rpc` → `link`.
 *   - the full flag bag survives on {@link Invocation.flags} so the meta checks
 *     (`--help` / `--version`) and the oneshot output-shape probe (`json`) keep
 *     reading the same canonical keys they always did.
 *
 * The parse is total and never throws: the launch reader tolerates unknown
 * `--flags` as boolean switches in the flag bag rather than rejecting them, so
 * nothing is silently dropped before a later phase can reinterpret it.
 */
import { readInvocation } from "../launch/index.js";
import type { Invocation } from "./contract.js";

function toRunnerId(mode: string): Invocation["mode"] {
  switch (mode) {
    case "rpc":
      return "link";
    case "json":
      return "oneshot";
    case "text":
    default:
      return "repl";
  }
}

function projectInvocation(launch: ReturnType<typeof readInvocation>): Invocation {
  const listModelsRaw = launch.flags["list-models"];
  const listModels = listModelsRaw !== undefined && listModelsRaw !== false;
  const listModelsFilter = typeof listModelsRaw === "string" && listModelsRaw.length > 0 ? listModelsRaw : undefined;
  return {
    mode: toRunnerId(launch.mode),
    ...launch.prompt !== undefined ? { prompt: launch.prompt } : {},
    ...launch.model !== undefined ? { modelId: launch.model } : {},
    ...launch.fallbackModel !== undefined ? { fallbackModelId: launch.fallbackModel } : {},
    ...launch.cwd !== undefined ? { cwd: launch.cwd } : {},
    ...launch.account !== undefined ? { account: launch.account } : {},
    ...launch.thinking !== undefined ? { thinking: launch.thinking } : {},
    ...launch.system !== undefined ? { system: launch.system } : {},
    ...launch.appendSystem !== undefined ? { appendSystem: launch.appendSystem } : {},
    ...launch.tools !== undefined ? { tools: launch.tools } : {},
    ...launch.noTools ? { noTools: true } : {},
    ...launch.mcp.length > 0 ? { mcp: launch.mcp } : {},
    ...launch.zohoUrl !== undefined && launch.zohoUrl !== "" ? { zohoUrl: launch.zohoUrl } : {},
    ...launch.noZoho ? { noZoho: true } : {},
    ...launch.sarvamKey !== undefined && launch.sarvamKey !== "" ? { sarvamKey: launch.sarvamKey } : {},
    ...launch.noSarvam ? { noSarvam: true } : {},
    ...launch.sarvamBasePath !== undefined && launch.sarvamBasePath !== "" ? { sarvamBasePath: launch.sarvamBasePath } : {},
    ...launch.flags["resume"] === true ? { resume: true } : {},
    ...launch.flags["continue"] === true ? { continueLatest: true } : {},
    ...listModels ? { listModels: true } : {},
    ...listModelsFilter !== undefined ? { listModelsFilter } : {},
    flags: launch.flags,
    rest: launch.positionals,
  };
}

/**
 * Read a sliced `process.argv` into the boot {@link Invocation}.
 *
 * Delegates the actual grammar to the launch {@link readInvocation} (the one
 * declarative flag table), then projects its result onto the boot shape. The
 * boot layer thus shares one parser with the launch subsystem — help, parsing,
 * and routing can no longer drift.
 *
 * @param argv The already-sliced argument vector (no node/exec path).
 */
export function tokenizeInvocation(argv: readonly string[]): Invocation {
  return projectInvocation(readInvocation(argv));
}

/** Whether the parsed invocation is asking for the help banner. */
export function wantsHelp(inv: Invocation): boolean {
  return inv.flags.help === true;
}

/** Whether the parsed invocation is asking for the version string. */
export function wantsVersion(inv: Invocation): boolean {
  return inv.flags.version === true;
}
