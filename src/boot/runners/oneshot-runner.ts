/**
 * Runner: `oneshot` — single non-interactive request to stdout.
 *
 * Drives the Phase-8 oneshot channel: it assembles a {@link SessionConductor}
 * for the invocation, builds a {@link ChannelContext} over `process.stdout`
 * (clean text, or a streamed NDJSON event log), runs every prompt to settlement
 * via {@link runOneshot}, and resolves the channel exit code. The output shape is
 * NDJSON when the invocation carries a `json` flag, otherwise clean text.
 */
import { inertDialog, ndjsonFramer, runOneshot } from "../../channels/index.js";
import type { Invocation, Runner } from "../contract.js";
import { oneshotPrompts, buildSessionConductor } from "./session.js";

const EXIT_NO_INPUT = 2;

const STDOUT = {
  write(chunk: string | Uint8Array, cb?: (err?: Error | null) => void) {
    return process.stdout.write(chunk, cb);
  },
};

function shapeOf(inv: Invocation): "ndjson" | "text" {
  return inv.flags.json === true || inv.flags.json === "true" ? "ndjson" : "text";
}

/**
 * The one-shot runner.
 *
 * {@link Runner.accepts} matches invocations whose resolved mode is `oneshot`.
 * {@link Runner.run} assembles the conductor and channel context, then delegates
 * the run to {@link runOneshot} and returns its exit code. With no request text
 * it writes a short notice and exits non-zero rather than mounting an empty run.
 */
export const oneshotRunner: Runner = {
  id: "oneshot",
  accepts(inv) {
    return inv.mode === "oneshot";
  },
  async run(ctx) {
    const prompts = oneshotPrompts(ctx);
    if (prompts.length === 0) {
      process.stderr.write("oneshot: no request text supplied\n");
      return EXIT_NO_INPUT;
    }
    const conductor = await buildSessionConductor(ctx);
    const channel = {
      conductor,
      out: STDOUT,
      framer: ndjsonFramer,
      dialog: inertDialog,
    };
    const request = {
      shape: shapeOf(ctx.invocation),
      prompts,
    };
    return runOneshot(channel, request);
  },
};
