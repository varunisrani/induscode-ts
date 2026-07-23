// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Shared slash-command helpers — the small, pure toolkit every command group is
 * written against.
 *
 * The console's slash catalog is split into topic groups (transcript control,
 * the workbench pickers, the integration bridges). Each group is its own module
 * exporting a `SlashCommand[]`; this file holds the handful of helpers they all
 * lean on so the groups stay free of duplicated wiring and the family
 * sub-command dispatch lives in exactly one place.
 *
 * Two stances every group keeps:
 *   1. **Handlers are thin.** A `run(ctx)` never reaches into React, the
 *      filesystem, or a provider SDK; every effect goes through the injected
 *      {@link SlashContext}. The handler decides *which* effect to raise.
 *   2. **Families are tables, not ladders.** A command with sub-verbs (e.g.
 *      `/memory note|show|forget`) is built from a {@link SubCommand} table via
 *      {@link familyRunner}, never a hand-written `if`-chain.
 */
import type { SlashContext, SlashOutcome, StatusMessage } from "../../contract";
/**
 * The family labels the catalog groups commands under for `/help` and
 * completion. Named constants (not bare strings scattered across rows) so the
 * grouping a command declares and the grouping the help view renders cannot
 * drift apart.
 */
export declare const FAMILY: {
    readonly composio: "composio";
    readonly memory: "memory";
    readonly scopedModels: "models-for";
    readonly theme: "theme";
};
/** The settled "command ran, nothing more to do" outcome. */
export declare const HANDLED: SlashOutcome;
/** Mint an info-tone status toast. */
export declare function info(text: string): StatusMessage;
/** Mint a warning-tone status toast (used for usage hints on bad args). */
export declare function warn(text: string): StatusMessage;
/**
 * Split a family command's argument string into a leading sub-command verb and
 * the remainder, both trimmed. An empty argument string yields an empty verb so
 * a family command can show its own usage when invoked bare.
 *
 * @param args the raw trailing argument string from {@link SlashContext.args}
 */
export declare function splitVerb(args: string): {
    verb: string;
    rest: string;
};
/**
 * One sub-command of a command family — its verb, a one-line description for the
 * usage list, and the thin action it runs through the {@link SlashContext}.
 */
export interface SubCommand {
    /** The sub-command verb, lower-cased (e.g. `add`, `list`, `clear`). */
    readonly verb: string;
    /** One-line description rendered in the family's usage toast. */
    readonly describe: string;
    /** Run the sub-command; `rest` is the argument tail after the verb. */
    run(ctx: SlashContext, rest: string): SlashOutcome;
}
/**
 * Build a family command's `run` from a sub-command table.
 *
 * The family handler is a single thin function whose branch structure is
 * *generated* from the table: it splits the verb, looks it up, and runs the
 * matching action — falling back to a usage toast (assembled from the table's
 * descriptions) when the verb is missing or unknown.
 *
 * @param family the family label, used in the usage header
 * @param subs   the sub-command table for this family
 */
export declare function familyRunner(family: string, subs: readonly SubCommand[]): (ctx: SlashContext) => SlashOutcome;
