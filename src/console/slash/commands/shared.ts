/**
 * Shared slash-command helpers — the small, pure toolkit every command group is written against.
 */
import type { SlashContext, SlashOutcome, StatusMessage } from "../../contract.js";

/**
 * The family labels the catalog groups commands under.
 */
export const FAMILY = {
  composio: "composio",
  memory: "memory",
  scopedModels: "models-for",
  theme: "theme"
} as const;

/** The settled "command ran, nothing more to do" outcome. */
export const HANDLED: SlashOutcome = { kind: "handled" };

/** Mint an info-tone status toast. */
export function info(text: string): StatusMessage {
  return { kind: "info", text };
}

/** Mint a warning-tone status toast (used for usage hints on bad args). */
export function warn(text: string): StatusMessage {
  return { kind: "warning", text };
}

/**
 * Split a family command's argument string into a leading sub-command verb and the remainder.
 */
export function splitVerb(args: string): { verb: string; rest: string } {
  const trimmed = args.trim();
  if (trimmed.length === 0) return { verb: "", rest: "" };
  const gap = trimmed.search(/\s/);
  if (gap === -1) return { verb: trimmed.toLowerCase(), rest: "" };
  return {
    verb: trimmed.slice(0, gap).toLowerCase(),
    rest: trimmed.slice(gap + 1).trim()
  };
}

/**
 * One sub-command of a command family.
 */
export interface SubCommand {
  readonly verb: string;
  readonly describe: string;
  run(ctx: SlashContext, rest: string): SlashOutcome;
}

/**
 * Build a family command's `run` from a sub-command table.
 */
export function familyRunner(family: string, subs: readonly SubCommand[]): (ctx: SlashContext) => SlashOutcome {
  const table = new Map(subs.map((sub) => [sub.verb, sub]));
  const usage = () =>
    warn(
      `/${family} expects: ${subs.map((sub) => `${sub.verb} (${sub.describe})`).join(", ")}`
    );
  return (ctx) => {
    const { verb, rest } = splitVerb(ctx.args);
    if (verb.length === 0) {
      ctx.setStatus(usage());
      return HANDLED;
    }
    const sub = table.get(verb);
    if (sub === void 0) {
      ctx.setStatus(warn(`/${family}: unrecognised action "${verb}".`));
      ctx.setStatus(usage());
      return HANDLED;
    }
    return sub.run(ctx, rest);
  };
}