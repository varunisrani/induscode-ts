/**
 * Slash subsystem — public barrel.
 */
export { SLASH_COMMANDS, FAMILY } from "./builtins.js";
export { buildRegistry, tokensOf, findCommand, matchPrefix, listFamilies, commandsInFamily } from "./registry.js";
export { SLASH_PREFIX, looksLikeSlash, parseSlash, resolveSlash } from "./resolve.js";
export type { SlashLine, SlashResolution } from "./resolve.js";
import { buildRegistry } from "./registry.js";
import { SLASH_COMMANDS } from "./builtins.js";
import type { SlashRegistry } from "../contract.js";

/**
 * The built-in catalog pre-folded into a resolved {@link SlashRegistry}.
 */
export const DEFAULT_SLASH_REGISTRY: SlashRegistry = buildRegistry(SLASH_COMMANDS);