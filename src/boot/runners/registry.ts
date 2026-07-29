/**
 * Runner registry — the table-driven replacement for a mode `if/else` ladder.
 *
 * The boot pipeline ends by handing the resolved {@link Invocation} to exactly
 * one {@link Runner}. Rather than branch on the mode string at the call site,
 * dispatch is data: {@link RUNNERS} lists every available runner in priority
 * order, and {@link selectRunner} returns the first whose {@link Runner.accepts}
 * predicate matches. Adding or reordering modes is a one-line edit to the table,
 * never a change to control flow.
 *
 * The interactive REPL is both first in the table and the guaranteed fallback:
 * if no runner claims an invocation, {@link selectRunner} returns it, so a bare
 * command line lands in the interactive session.
 */
import type { Invocation, Runner } from "../contract.js";
import { replRunner } from "./repl-runner.js";
import { oneshotRunner } from "./oneshot-runner.js";
import { linkRunner } from "./link-runner.js";

/**
 * Every runner the boot layer can dispatch to, in match-priority order.
 *
 * {@link selectRunner} scans this list front-to-back and returns the first
 * accepting runner; `replRunner` leads the list and also serves as the default.
 */
export const RUNNERS: readonly Runner[] = [replRunner, oneshotRunner, linkRunner];

/**
 * Choose the runner for a parsed {@link Invocation}.
 *
 * Returns the first runner in {@link RUNNERS} that {@link Runner.accepts | accepts}
 * the invocation; if none does, falls back to the interactive REPL runner so
 * dispatch is total and a runner is always returned.
 */
export function selectRunner(inv: Invocation): Runner {
  for (const runner of RUNNERS) {
    if (runner.accepts(inv)) {
      return runner;
    }
  }
  return replRunner;
}
