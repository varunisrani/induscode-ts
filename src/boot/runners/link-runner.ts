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
import { createLinkServer, SESSION_OPS } from "../../channels/index.js";
import type { Runner } from "../contract.js";
import { buildSessionConductor } from "./session.js";

const EXIT_OK = 0;

const STDOUT = {
  write(chunk: string | Uint8Array, cb?: (err?: Error | null) => void) {
    return process.stdout.write(chunk, cb);
  },
};

/**
 * The headless-link runner.
 *
 * {@link Runner.accepts} matches invocations whose resolved mode is `link`.
 * {@link Runner.run} assembles the conductor, starts a link server reading framed
 * requests from stdin and writing framed replies to stdout, and resolves the
 * success exit code when the inbound stream is exhausted.
 */
export const linkRunner: Runner = {
  id: "link",
  accepts(inv) {
    return inv.mode === "link";
  },
  async run(ctx) {
    const conductor = await buildSessionConductor(ctx);
    const server = createLinkServer(SESSION_OPS, conductor, {
      in: process.stdin,
      out: STDOUT,
    });
    await server.done;
    return EXIT_OK;
  },
};
