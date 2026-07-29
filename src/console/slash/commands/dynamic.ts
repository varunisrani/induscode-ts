/**
 * Dynamic slash commands — capability cards and prompt templates as registry rows.
 */
import { applyMacros } from "../../../briefing/index.js";
import type { Macro, SkillCard } from "../../../briefing/index.js";
import type { SlashCommand } from "../../contract.js";

const SKILL_PREFIX = "skill:";
const SUMMARY_BUDGET = 88;

function clampSummary(text: string) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= SUMMARY_BUDGET) return oneLine;
  return `${oneLine.slice(0, SUMMARY_BUDGET - 1).trimEnd()}…`;
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function skillInvocationBlock(card: SkillCard, body: string) {
  const opener = `<skill name="${escapeAttr(card.name)}" location="${escapeAttr(card.location)}">`;
  return `${opener}\n${body}\n</skill>`;
}

function skillCommand(card: SkillCard): SlashCommand {
  const name = `${SKILL_PREFIX}${card.name}`;
  return {
    name,
    summary: clampSummary(card.description),
    family: "skill",
    takesArgs: true,
    run(ctx) {
      const body = ctx.args.trim();
      return { kind: "prompt", text: skillInvocationBlock(card, body) };
    }
  };
}

function templateCommand(macro: Macro): SlashCommand {
  return {
    name: macro.name,
    summary: clampSummary(macro.description),
    family: "template",
    takesArgs: true,
    run(ctx) {
      const text = applyMacros(macro.body, ctx.args);
      return { kind: "prompt", text };
    }
  };
}

/**
 * The discovered material a dynamic catalog is built from.
 */
export interface DynamicCommandSources {
  readonly skills?: readonly SkillCard[];
  readonly templates?: readonly Macro[];
}

/**
 * Project discovered skills and templates into {@link SlashCommand} rows.
 */
export function buildDynamicCommands(sources: DynamicCommandSources = {}): SlashCommand[] {
  const rows: SlashCommand[] = [];
  const claimed = new Set<string>();
  for (const card of sources.skills ?? []) {
    const command = skillCommand(card);
    if (claimed.has(command.name)) continue;
    claimed.add(command.name);
    rows.push(command);
  }
  for (const macro of sources.templates ?? []) {
    if (claimed.has(macro.name)) continue;
    claimed.add(macro.name);
    rows.push(templateCommand(macro));
  }
  return rows;
}