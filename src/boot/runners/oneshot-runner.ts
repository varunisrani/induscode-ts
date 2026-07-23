// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Runner: `oneshot` — single non-interactive request to stdout.
 *
 * Drives the Phase-8 oneshot channel: it assembles a {@link SessionConductor}
 * for the invocation, builds a {@link ChannelContext} over `process.stdout`
 * (clean text, or a streamed NDJSON event log), runs every prompt to settlement
 * via {@link runOneshot}, and resolves the channel exit code. The output shape is
 * NDJSON when the invocation carries a `json` flag, otherwise clean text.
 */
import type { Runner } from "../contract";
/**
 * The one-shot runner.
 *
 * {@link Runner.accepts} matches invocations whose resolved mode is `oneshot`.
 * {@link Runner.run} assembles the conductor and channel context, then delegates
 * the run to {@link runOneshot} and returns its exit code. With no request text
 * it writes a short notice and exits non-zero rather than mounting an empty run.
 */
export declare const oneshotRunner: Runner;
