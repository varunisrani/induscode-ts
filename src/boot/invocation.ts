// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
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
import type { Invocation } from "./contract";
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
export declare function tokenizeInvocation(argv: readonly string[]): Invocation;
/** Whether the parsed invocation is asking for the help banner. */
export declare function wantsHelp(inv: Invocation): boolean;
/** Whether the parsed invocation is asking for the version string. */
export declare function wantsVersion(inv: Invocation): boolean;
