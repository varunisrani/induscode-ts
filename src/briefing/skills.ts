import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { SKILL_DESCRIPTION_LIMIT, SKILL_NAME_LIMIT } from "./contract.js";
import type { MacroOrigin, SkillCard, SkillDiagnostic, SkillFrontmatter, SkillLoad } from "./contract.js";
import { splitFrontmatter } from "./macros.js";

export interface SkillRoot { readonly dir: string; readonly origin: MacroOrigin; }
interface Candidate { path: string; dirName: string; }

export const SKILL_MANIFEST = "SKILL.md";
export const PRUNED_DIRS = new Set(["node_modules", ".git"]);
export const KNOWN_FRONTMATTER_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools", "disable-model-invocation"]);

function* walkCandidates(root: string, seen: Set<string>): Generator<Candidate> { yield* walkLevel(root, true, seen); }
function* walkLevel(dir: string, atRoot: boolean, seen: Set<string>): Generator<Candidate> {
  let entries: string[]; try { entries = readdirSync(dir).sort(); } catch { return; }
  for (const entry of entries) {
    if (entry.startsWith(".")) continue; const full = join(dir, entry); let stats: import("node:fs").Stats;
    try { stats = statSync(full); } catch { continue; }
    if (stats.isDirectory()) { if (PRUNED_DIRS.has(entry)) continue; let real: string; try { real = realpathSync(full); } catch { continue; } if (!seen.has(real)) { seen.add(real); yield* walkLevel(full, false, seen); } }
    else if (stats.isFile() && ((atRoot && entry.toLowerCase().endsWith(".md")) || (!atRoot && entry === SKILL_MANIFEST))) yield { path: full, dirName: basename(dirname(full)) };
  }
}

export function checkName(name: string, dirName: string, fromDir: boolean): string | null { if (!name) return "a skill must declare a non-empty name"; if (name.length > SKILL_NAME_LIMIT) return `the name exceeds the ${SKILL_NAME_LIMIT}-character limit`; if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) return "the name must be lowercase words joined by single hyphens"; if (!fromDir && name !== dirName) return `the declared name "${name}" does not match its directory "${dirName}"`; return null; }
export function checkDescription(description: string): string | null { if (!description) return "a skill must declare a description so the model can gate it"; return description.length > SKILL_DESCRIPTION_LIMIT ? `the description exceeds the ${SKILL_DESCRIPTION_LIMIT}-character limit` : null; }
export function checkFrontmatterKeys(frontmatter: Record<string, unknown>): string | null { for (const key of Object.keys(frontmatter)) if (!KNOWN_FRONTMATTER_KEYS.has(key)) return `unrecognised frontmatter key "${key}"`; return null; }
export function projectFrontmatter(raw: Record<string, unknown>): SkillFrontmatter {
  const out: { name?: string; description?: string; license?: string; compatibility?: string; metadata?: Readonly<Record<string, unknown>>; allowedTools?: readonly string[]; disableModelInvocation?: boolean } = {};
  for (const key of ["name", "description", "license", "compatibility"] as const) if (typeof raw[key] === "string") out[key] = raw[key].trim();
  if (typeof raw.metadata === "object" && raw.metadata !== null) out.metadata = raw.metadata as Record<string, unknown>;
  const tools = raw["allowed-tools"]; if (typeof tools === "string") { const list = tools.split(/[\s,]+/).filter(Boolean); if (list.length) out.allowedTools = list; } else if (Array.isArray(tools)) out.allowedTools = tools.map(String);
  if (raw["disable-model-invocation"] === true || raw["disable-model-invocation"] === "true") out.disableModelInvocation = true;
  return out;
}
export function diag(kind: SkillDiagnostic["kind"], location: string, detail: string): SkillDiagnostic { return { kind, location, detail }; }
export function describeCause(cause: unknown): string { return cause instanceof Error ? cause.message : String(cause); }
export function parseCandidate(candidate: Candidate, origin: MacroOrigin): { card: SkillCard | null; diagnostic: SkillDiagnostic } {
  let text: string; try { text = readFileSync(candidate.path, "utf8"); } catch (cause) { return { card: null, diagnostic: diag("invalid", candidate.path, `could not read the skill file (${describeCause(cause)})`) }; }
  const { frontmatter, body } = splitFrontmatter(text); const keyProblem = checkFrontmatterKeys(frontmatter); if (keyProblem) return { card: null, diagnostic: diag("invalid", candidate.path, keyProblem) };
  const fm = projectFrontmatter(frontmatter); const fromDir = !(fm.name ?? ""); const name = fromDir ? candidate.dirName : fm.name!; const nameProblem = checkName(name, candidate.dirName, fromDir); if (nameProblem) return { card: null, diagnostic: diag("invalid", candidate.path, nameProblem) };
  const description = fm.description ?? ""; const descriptionProblem = checkDescription(description); if (descriptionProblem) return { card: null, diagnostic: diag("invalid", candidate.path, descriptionProblem) };
  return { card: { name, description, body, location: candidate.path, origin, frontmatter: fm }, diagnostic: diag("loaded", candidate.path, `loaded skill "${name}"`) };
}
export function loadSkillCards(dir: string, origin: MacroOrigin = "path"): SkillLoad { const cards: SkillCard[] = []; const diagnostics: SkillDiagnostic[] = []; for (const candidate of walkCandidates(dir, new Set())) { const parsed = parseCandidate(candidate, origin); diagnostics.push(parsed.diagnostic); if (parsed.card) cards.push(parsed.card); } return { cards, diagnostics }; }
export function gatherSkillCards(roots: readonly SkillRoot[]): SkillLoad { const cards: SkillCard[] = []; const diagnostics: SkillDiagnostic[] = []; const claimed = new Map<string, string>(); for (const root of roots) { const loaded = loadSkillCards(root.dir, root.origin); diagnostics.push(...loaded.diagnostics.filter((item: SkillDiagnostic) => item.kind !== "loaded")); for (const card of loaded.cards) { const winner = claimed.get(card.name); if (winner) diagnostics.push(diag("collision", card.location, `the name "${card.name}" was already claimed by ${winner}; this card is dropped`)); else { claimed.set(card.name, card.location); cards.push(card); diagnostics.push(diag("loaded", card.location, `loaded skill "${card.name}"`)); } } } return { cards, diagnostics }; }
export function modelInvocableCards(cards: readonly SkillCard[]): SkillCard[] { return cards.filter((card) => card.frontmatter.disableModelInvocation !== true); }
