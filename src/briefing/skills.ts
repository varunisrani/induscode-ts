// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Capability-card loader — `SKILL.md` discovery, validation, and parsing.
 *
 * A capability card is *documentation the model reads*: a markdown file in the
 * Agent-Skills format whose frontmatter names a skill and one-line-describes when
 * it applies, with a body of on-demand instructions. The model decides from the
 * `description` whether a task matches, then loads the file's `location` to read
 * the full body. This module turns a set of directory roots into validated
 * {@link SkillCard}s plus a diagnostic stream.
 *
 * Discovery follows the format's two shapes, with a generic directory walk rather
 * than a special-cased recursion:
 *
 *   - At a *root* level, a direct `*.md` child is a single-file skill.
 *   - In any *subdirectory*, a `SKILL.md` file is a packaged skill whose name is
 *     expected to match its enclosing directory.
 *
 * The walk yields candidate file descriptors; a separate validation stage turns
 * each candidate into one {@link SkillDiagnostic} (and, on success, one
 * {@link SkillCard}). Validation prose and field policy are the briefing's own;
 * only the *format* (frontmatter keys, the ≤64 / ≤1024 limits, lowercase-hyphen
 * names) is the shared public spec. Names are deduped across roots — the first
 * card to claim a name wins and later claimants are reported as collisions.
 */
import type { MacroOrigin, SkillCard, SkillLoad } from "./contract";
/** One root directory to load skill cards from, with its origin tag. */
export interface SkillRoot {
    /** The directory to walk. */
    readonly dir: string;
    /** How cards discovered under this root are tagged. */
    readonly origin: MacroOrigin;
}
/**
 * Load and validate the capability cards under one directory root.
 *
 * Walks the root for candidates, parses each, and accumulates the diagnostics.
 * Name deduplication is *not* applied here (a single root rarely collides with
 * itself in a way worth reporting); use {@link gatherSkillCards} to merge several
 * roots with collision reporting. Symlink cycles within the root are broken by
 * realpath tracking.
 *
 * @param dir    the root directory to scan
 * @param origin the origin tag for cards found here
 * @returns the cards and diagnostics produced from this root
 */
export declare function loadSkillCards(dir: string, origin?: MacroOrigin): SkillLoad;
/**
 * Load and merge capability cards from several roots, deduping by name.
 *
 * Roots are processed in order; the first card to claim a name wins, and any
 * later card with the same name is dropped with a `collision` diagnostic (its
 * own per-root `loaded` line is rewritten to the collision outcome). The merged
 * card list is the deduped survivors, in discovery order.
 *
 * @param roots the roots to load, in precedence order (earliest wins)
 * @returns the merged cards and the combined diagnostic stream
 */
export declare function gatherSkillCards(roots: readonly SkillRoot[]): SkillLoad;
/**
 * Filter cards down to those the model may auto-invoke (i.e. that are not marked
 * `disable-model-invocation`). The hidden cards remain available as explicit
 * commands but do not appear in the briefing's skill block.
 *
 * @param cards the full card set
 * @returns the subset eligible for model invocation
 */
export declare function modelInvocableCards(cards: readonly SkillCard[]): SkillCard[];
