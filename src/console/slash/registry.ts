/**
 * Slash registry assembly — fold a command list into the resolved registry.
 */
import type { SlashCommand, SlashRegistry } from "../contract.js";

/**
 * Every token a command answers to: its canonical name plus any aliases.
 */
export function tokensOf(command: SlashCommand): string[] {
  return [command.name, ...(command.aliases ?? [])];
}

/**
 * Fold an ordered command list into a resolved {@link SlashRegistry}.
 */
export function buildRegistry(commands: readonly SlashCommand[]): SlashRegistry {
  const index = new Map<string, SlashCommand>();
  for (const command of commands) {
    for (const token of tokensOf(command)) {
      const key = token.toLowerCase();
      const existing = index.get(key);
      if (existing !== void 0 && existing !== command) {
        throw new Error(
          `slash registry: token "${key}" is claimed by both "${existing.name}" and "${command.name}"`
        );
      }
      index.set(key, command);
    }
  }
  return { commands, index };
}

/**
 * Resolve a single token (canonical or alias) to its command, or `undefined`.
 */
export function findCommand(registry: SlashRegistry, token: string): SlashCommand | undefined {
  const bare = token.startsWith("/") ? token.slice(1) : token;
  return registry.index.get(bare.toLowerCase());
}

/**
 * The commands whose name or alias begins with a partial token, in registry order.
 */
export function matchPrefix(registry: SlashRegistry, partial: string): SlashCommand[] {
  const needle = partial.toLowerCase();
  if (needle.length === 0) return [...registry.commands];
  return registry.commands.filter(
    (command) => tokensOf(command).some((token) => token.toLowerCase().startsWith(needle))
  );
}

/**
 * The distinct family labels present in the registry, in first-seen order.
 */
export function listFamilies(registry: SlashRegistry): string[] {
  const seen: string[] = [];
  for (const command of registry.commands) {
    if (command.family !== void 0 && !seen.includes(command.family)) {
      seen.push(command.family);
    }
  }
  return seen;
}

/**
 * The commands belonging to a family, in registry order.
 */
export function commandsInFamily(registry: SlashRegistry, family: string): SlashCommand[] {
  return registry.commands.filter((command) => command.family === family);
}