// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Slash registry assembly — fold a command list into the resolved registry.
 *
 * The slash subsystem keeps exactly one hand-maintained list of commands (the
 * {@link SLASH_COMMANDS} array in `builtins.ts`); everything a consumer needs to
 * resolve, complete, or list a command is *derived* from that array here. This
 * module is the bridge between the flat data and the {@link SlashRegistry} shape
 * the contract froze:
 *
 *   - {@link buildRegistry} indexes the list by canonical name *and* by every
 *     alias, so {@link import("./resolve").resolveSlash} is an O(1) map lookup
 *     rather than a scan. It also guards the one invariant a flat array cannot:
 *     two rows must not claim the same token (a duplicate name or alias is a
 *     programming error, surfaced loudly at assembly time, not silently shadowed).
 *   - {@link matchPrefix} powers the completion window: given the partial token
 *     the user has typed, it returns the rows whose name or alias starts with it,
 *     in registry order.
 *   - {@link commandsInFamily} / {@link listFamilies} project the `family` field
 *     for grouped listing (the `/help` overlay, the completion grouping).
 *
 * No effects, no React, no conductor — the registry is a value, and these are
 * pure derivations over it. The dispatcher consumes the registry; it is not
 * built here.
 */
import type { SlashCommand, SlashRegistry } from "../contract";
/**
 * Every token a command answers to: its canonical name plus any aliases.
 *
 * The single place name/alias enumeration happens, so the index builder and the
 * prefix matcher agree on what counts as "a token for this command".
 *
 * @param command the command to enumerate tokens for
 */
export declare function tokensOf(command: SlashCommand): string[];
/**
 * Fold an ordered command list into a resolved {@link SlashRegistry}.
 *
 * Preserves the input order in {@link SlashRegistry.commands} (it is the listing
 * order the completion window and `/help` render in) and derives the
 * {@link SlashRegistry.index} by mapping every token — canonical and alias — to
 * its owning command. Tokens are lower-cased on the way in so resolution can be
 * case-insensitive without the resolver re-normalising.
 *
 * Throws when two rows claim the same token: a flat array cannot express
 * "these names are disjoint", so the invariant is enforced here, at the one
 * point the table is assembled, instead of letting a later row silently shadow
 * an earlier one.
 *
 * @param commands the ordered command list (the single source of truth)
 */
export declare function buildRegistry(commands: readonly SlashCommand[]): SlashRegistry;
/**
 * Resolve a single token (canonical or alias) to its command, or `undefined`.
 *
 * A thin, case-insensitive read of {@link SlashRegistry.index} so call sites do
 * not re-implement the lower-casing the registry index expects.
 *
 * @param registry the registry to read
 * @param token    a canonical name or alias, with or without a leading slash
 */
export declare function findCommand(registry: SlashRegistry, token: string): SlashCommand | undefined;
/**
 * The commands whose name or alias begins with a partial token, in registry
 * order — the candidate set the completion window renders.
 *
 * Matching is case-insensitive and prefix-based against *every* token a command
 * answers to, but each command appears at most once even when several of its
 * tokens match. An empty partial returns the whole list (the bare-`/` case where
 * the user has opened the completion window but typed nothing yet).
 *
 * @param registry the registry to search
 * @param partial  the partial command token (without a leading slash)
 */
export declare function matchPrefix(registry: SlashRegistry, partial: string): SlashCommand[];
/**
 * The distinct family labels present in the registry, in first-seen order.
 *
 * Commands without a `family` are omitted; the result drives the grouped
 * headings in `/help` and the completion window.
 *
 * @param registry the registry to scan
 */
export declare function listFamilies(registry: SlashRegistry): string[];
/**
 * The commands belonging to a family, in registry order.
 *
 * @param registry the registry to filter
 * @param family   the family label to select
 */
export declare function commandsInFamily(registry: SlashRegistry, family: string): SlashCommand[];
