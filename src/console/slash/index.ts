// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Slash subsystem — public barrel.
 *
 * The console's data-driven slash layer, in three pure pieces:
 *
 *   - **The catalog** — {@link SLASH_COMMANDS}, the single ordered list of
 *     {@link SlashCommand} rows (core commands plus the `composio` / `memory` /
 *     `scoped-models` / `theme` families). There is no command `if`-ladder; a new
 *     command is a new row.
 *   - **The registry** — {@link buildRegistry} folds the catalog into the frozen
 *     {@link SlashRegistry} shape (commands + a name/alias index), and the derived
 *     lookups ({@link matchPrefix}, {@link findCommand}, {@link commandsInFamily},
 *     {@link listFamilies}) power resolution, completion, and grouped listing.
 *   - **Resolution** — {@link resolveSlash} parses a typed composer line and
 *     resolves it against a registry to a discriminated {@link SlashResolution}.
 *
 * {@link DEFAULT_SLASH_REGISTRY} is the catalog pre-folded into a registry, the
 * value the console mounts with. The effectful dispatcher (which calls a matched
 * command's `run`) lives outside this barrel; everything exported here is pure.
 */
export { SLASH_COMMANDS, FAMILY } from "./builtins";
export { buildRegistry, tokensOf, findCommand, matchPrefix, listFamilies, commandsInFamily, } from "./registry";
export { SLASH_PREFIX, looksLikeSlash, parseSlash, resolveSlash, type SlashLine, type SlashResolution, } from "./resolve";
import type { SlashRegistry } from "../contract";
/**
 * The built-in catalog pre-folded into a resolved {@link SlashRegistry}.
 *
 * The default the console mounts with: the catalog indexed by every canonical
 * name and alias, ready for {@link resolveSlash} and the completion matcher. A
 * caller that needs to splice in prompt templates, plugin commands, or
 * `/skill:*` entries builds its own registry from a concatenated list via
 * {@link buildRegistry} rather than mutating this one.
 */
export declare const DEFAULT_SLASH_REGISTRY: SlashRegistry;
