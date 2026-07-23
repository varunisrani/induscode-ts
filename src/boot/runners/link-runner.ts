// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Runner: `link` — headless JSON-RPC link for a driving parent process.
 *
 * Drives the Phase-8 link channel: it assembles a {@link SessionConductor} for
 * the invocation and serves the declarative {@link SESSION_OPS} registry over the
 * process stdio pair via {@link createLinkServer}. Every framed request is
 * dispatched through the registry (data-driven, not a command switch) and the
 * reply is framed back; the runner resolves the success exit code once the
 * inbound stream ends.
 */
import type { Runner } from "../contract";
/**
 * The headless-link runner.
 *
 * {@link Runner.accepts} matches invocations whose resolved mode is `link`.
 * {@link Runner.run} assembles the conductor, starts a link server reading framed
 * requests from stdin and writing framed replies to stdout, and resolves the
 * success exit code when the inbound stream is exhausted.
 */
export declare const linkRunner: Runner;
