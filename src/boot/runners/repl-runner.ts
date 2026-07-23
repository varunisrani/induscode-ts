// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Runner: `repl` — interactive terminal session.
 *
 * Mounts the Phase-7 console for a live session: it assembles a
 * {@link SessionConductor} for the invocation and renders the interactive surface
 * via {@link mountConsole}, seeding it with the positional prompt when one was
 * supplied. The runner resolves the success exit code once the surface is
 * dismissed.
 */
import type { Runner } from "../contract";
/**
 * The interactive-REPL runner.
 *
 * {@link Runner.accepts} matches invocations whose resolved mode is `repl`; it is
 * also the registry default, so it is reached for the empty / interactive command
 * line. {@link Runner.run} assembles the conductor, honours `--resume` /
 * `--continue`, and mounts the console.
 */
export declare const replRunner: Runner;
