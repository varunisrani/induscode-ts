/**
 * Startup gathering — the pure resource/notices/changelog reader the banner draws.
 *
 * The interactive console opens with a one-shot survey of what the session has to
 * work with: which context documents the agent will read, which capability cards
 * (skills) and prompt templates (commands) were discovered on disk, and a count
 * of each. This module *gathers* that survey and nothing else.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gatherSkillCards, loadMacros } from "../briefing/index.js";

const PROFILE_DIR = ".indusagi";
const CONTEXT_FILES = ["AGENTS.md", "CLAUDE.md"];

function skillRoots(cwd: string, home: string) {
  return [
    { dir: join(cwd, PROFILE_DIR, "skills"), origin: "project" as const },
    { dir: join(home, PROFILE_DIR, "skills"), origin: "user" as const }
  ];
}

function macroRoots(cwd: string, home: string) {
  return [
    { dir: join(cwd, PROFILE_DIR, "commands"), origin: "project" as const, label: "project" },
    { dir: join(home, PROFILE_DIR, "commands"), origin: "user" as const, label: "user" }
  ];
}

function shortenPath(path: string, cwd: string, home: string) {
  if (cwd.length > 0 && path.startsWith(cwd)) {
    const rest = path.slice(cwd.length).replace(/^[/\\]+/, "");
    return rest.length > 0 ? `./${rest}` : ".";
  }
  if (home.length > 0 && path.startsWith(home)) {
    return `~${path.slice(home.length)}`;
  }
  return path;
}

const MAX_SECTION_LINES = 6;

function capLines(lines: string[]) {
  if (lines.length <= MAX_SECTION_LINES) return [...lines];
  const head = lines.slice(0, MAX_SECTION_LINES);
  return [...head, `... ${lines.length - MAX_SECTION_LINES} more`];
}

function section(title: string, lines: string[]): StartupSection | null {
  const filtered = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  if (filtered.length === 0) return null;
  return { title, lines: capLines(filtered), count: filtered.length };
}

function gatherContext(cwd: string, home: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const root of [cwd, home]) {
    if (root.length === 0) continue;
    for (const name of CONTEXT_FILES) {
      const path = join(root, name);
      if (seen.has(path)) continue;
      seen.add(path);
      if (existsSync(path)) out.push(shortenPath(path, cwd, home));
    }
  }
  return out;
}

function gatherSkills(cwd: string, home: string) {
  let cards: Array<{ name: string; location: string }> = [];
  try {
    cards = gatherSkillCards(skillRoots(cwd, home)).cards.slice();
  } catch {
    cards = [];
  }
  return cards.map((card) => `${card.name}  ${shortenPath(card.location, cwd, home)}`);
}

function gatherPrompts(cwd: string, home: string) {
  const lines: string[] = [];
  const claimed = new Set<string>();
  for (const root of macroRoots(cwd, home)) {
    let loaded: Array<{ name: string; source: string }> = [];
    try {
      loaded = loadMacros(root.dir, { origin: root.origin, label: root.label });
    } catch {
      loaded = [];
    }
    for (const macro of loaded) {
      if (claimed.has(macro.name)) continue;
      claimed.add(macro.name);
      lines.push(`/${macro.name}  ${shortenPath(macro.source, cwd, home)}`);
    }
  }
  return lines;
}

/**
 * Gather the startup map: context documents, skills, and prompt templates.
 */
export function gatherStartup(inputs: StartupInputs): StartupMap {
  const { cwd, home } = inputs;
  const sections: StartupSection[] = [];
  const context = section("Context", gatherContext(cwd, home));
  if (context) sections.push(context);
  const skills = section("Skills", gatherSkills(cwd, home));
  if (skills) sections.push(skills);
  const prompts = section("Prompts", gatherPrompts(cwd, home));
  if (prompts) sections.push(prompts);
  return { sections };
}

function condenseChangelog(markdown: string, lastSeen?: string) {
  if (lastSeen === void 0 || lastSeen.length === 0) return markdown.trim();
  const lines = markdown.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const heading = /^##\s+\[?(\d+\.\d+\.\d+)\]?/.exec(line);
    if (heading && heading[1] === lastSeen) break;
    kept.push(line);
  }
  const joined = kept.join("\n").trim();
  return joined.length > 0 ? joined : markdown.trim();
}

function reverseChangelogEntries(markdown: string) {
  const isEntryHeading = (line: string) => /^##\s+\[?\d+\.\d+\.\d+\]?/.test(line);
  const lines = markdown.split("\n");
  const firstEntry = lines.findIndex(isEntryHeading);
  if (firstEntry === -1) return markdown.trim();
  const preamble = lines.slice(0, firstEntry).join("\n").trim();
  const blocks: string[][] = [];
  for (const line of lines.slice(firstEntry)) {
    if (isEntryHeading(line)) blocks.push([line]);
    else if (blocks.length > 0) blocks[blocks.length - 1].push(line);
  }
  blocks.reverse();
  const body = blocks.map((block) => block.join("\n").trim()).filter((block) => block.length > 0).join("\n\n");
  return preamble.length > 0 ? `${preamble}\n\n${body}` : body;
}

/**
 * Gather the changelog survey for the banner.
 */
export function gatherChangelog(inputs: StartupInputs): StartupChangelog {
  const { version, lastSeenVersion, changelogPath } = inputs;
  const none: StartupChangelog = { mode: "none", version };
  if (changelogPath === void 0 || !existsSync(changelogPath)) return none;
  if (lastSeenVersion !== void 0 && lastSeenVersion === version) return none;
  let raw: string;
  try {
    raw = readFileSync(changelogPath, "utf-8");
  } catch {
    return none;
  }
  const condensed = condenseChangelog(raw, lastSeenVersion);
  if (condensed.length === 0) {
    return { mode: "condensed", version };
  }
  if (lastSeenVersion === void 0) {
    return { mode: "condensed", version };
  }
  return { mode: "full", version, markdown: reverseChangelogEntries(condensed) };
}

/**
 * One labelled group inside the startup map.
 */
export interface StartupSection {
  readonly title: string;
  readonly lines: readonly string[];
  readonly count: number;
}

/**
 * The gathered survey the banner renders as the "Startup Map" panel.
 */
export interface StartupMap {
  readonly sections: readonly StartupSection[];
}

/**
 * The changelog survey the banner may render as a "What is new" block.
 */
export type StartupChangelogMode = "none" | "full" | "condensed";

export interface StartupChangelog {
  readonly mode: StartupChangelogMode;
  readonly version: string;
  readonly markdown?: string;
}

/** The per-line tone a startup notice carries. */
export type StartupNoticeKind = "error" | "warning" | "info";

export interface StartupNotice {
  readonly kind: StartupNoticeKind;
  readonly text: string;
}

/** What {@link gatherStartup} is handed to compute the survey. */
export interface StartupInputs {
  readonly cwd: string;
  readonly home: string;
  readonly version: string;
  readonly lastSeenVersion?: string;
  readonly changelogPath?: string;
}