/**
 * The built-in slash catalog — the single ordered source of truth.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { gatherSkillCards, loadMacros } from "../../briefing/index.js";
import type { SkillCard, Macro } from "../../briefing/index.js";
import type { SlashCommand } from "../contract.js";
import { FAMILY } from "./commands/shared.js";
import { buildDynamicCommands } from "./commands/dynamic.js";
import { integrationCommands } from "./commands/integrations.js";
import { transcriptCommands } from "./commands/transcript.js";
import { workbenchCommands } from "./commands/workbench.js";

const PROJECT_DIR = ".indusagi";

function dynamicRoots() {
  const home = homedir();
  const cwd = process.cwd();
  return {
    skills: [
      { dir: join(cwd, PROJECT_DIR, "skills"), origin: "project" as const },
      { dir: join(home, PROJECT_DIR, "skills"), origin: "user" as const }
    ],
    macros: [
      { dir: join(cwd, PROJECT_DIR, "commands"), origin: "project" as const, label: "project" },
      { dir: join(home, PROJECT_DIR, "commands"), origin: "user" as const, label: "user" }
    ]
  };
}

function discoverDynamicSources() {
  const roots = dynamicRoots();
  let skills: SkillCard[] = [];
  try {
    skills = gatherSkillCards(roots.skills).cards.slice();
  } catch {
    skills = [];
  }
  const templates: Macro[] = [];
  const claimed = new Set<string>();
  for (const root of roots.macros) {
    let loaded: Macro[] = [];
    try {
      loaded = loadMacros(root.dir, { origin: root.origin, label: root.label });
    } catch {
      loaded = [];
    }
    for (const macro of loaded) {
      if (claimed.has(macro.name)) continue;
      claimed.add(macro.name);
      templates.push(macro);
    }
  }
  return { skills, templates };
}

const staticCommands: SlashCommand[] = [
  ...transcriptCommands,
  ...workbenchCommands,
  ...integrationCommands
];

const reservedTokens = new Set<string>();
for (const command of staticCommands) {
  reservedTokens.add(command.name.toLowerCase());
  for (const alias of command.aliases ?? []) reservedTokens.add(alias.toLowerCase());
}

const dynamicCommands = buildDynamicCommands(discoverDynamicSources()).filter(
  (command) => !reservedTokens.has(command.name.toLowerCase())
);

/**
 * The built-in catalog — every command row in listing order.
 */
export const SLASH_COMMANDS: readonly SlashCommand[] = [
  ...staticCommands,
  ...dynamicCommands
];

export { FAMILY };