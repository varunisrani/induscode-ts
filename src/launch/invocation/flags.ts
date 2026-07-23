// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * The single declarative flag table.
 *
 * Every recognised command-line option is described here exactly once, as one
 * {@link FlagSpec} row. Two consumers walk this same table:
 *
 *   - the reader ({@link readInvocation}) indexes it by canonical name and alias
 *     to bind raw tokens into the parsed {@link Invocation}; and
 *   - the usage generator ({@link renderUsage}) enumerates it to render the
 *     option reference — there is no second, hand-maintained help string for it
 *     to drift against.
 *
 * Because both sides read the same rows, the help text and the parser cannot
 * disagree about which flags exist, what they take, or what they mean. The order
 * of the rows is the order options appear in the generated usage, grouped by the
 * {@link FlagGroup} sidecar map below; keeping that order intentional is the only
 * editorial concern when a row is added.
 *
 * Flag names and their semantics are a stable product contract (and largely an
 * industry convention), so they are kept as-is; only the table that declares
 * them and the code that reads it are owned here.
 */
import type { FlagSpec } from "../contract";
/**
 * The heading a flag is filed under in the generated usage. Purely an editorial
 * grouping for {@link renderUsage}; it has no effect on parsing.
 */
export type FlagGroup = "output" | "model" | "context" | "tools" | "meta";
/**
 * A {@link FlagSpec} carrying its usage section. The extra {@link group} field is
 * inert at parse time; the reader ignores it and only the renderer reads it.
 */
export interface GroupedFlagSpec extends FlagSpec {
    /** The usage section this row is rendered under. */
    readonly group: FlagGroup;
}
/**
 * Human-readable titles for each {@link FlagGroup}, in render order. The usage
 * generator walks this list, then within each group emits the matching rows from
 * {@link FLAG_SPECS} in declaration order.
 */
export declare const FLAG_GROUPS: readonly {
    readonly id: FlagGroup;
    readonly title: string;
}[];
/**
 * The one declarative option table. Every recognised flag is one row; the reader
 * and the usage generator both index this and nothing else.
 *
 * Conventions:
 *   - {@link FlagSpec.name} is the canonical long spelling (leading dashes
 *     included) and also the key the parsed value lands under in
 *     {@link Invocation.flags} (sans the dashes).
 *   - {@link FlagSpec.aliases} hold short forms and synonyms; every alias hit
 *     normalises to {@link FlagSpec.name}.
 *   - {@link FlagSpec.kind} fixes the value vocabulary: `boolean` switches,
 *     `string` / `number` value flags, and accumulating `list` flags.
 */
export declare const FLAG_SPECS: readonly GroupedFlagSpec[];
