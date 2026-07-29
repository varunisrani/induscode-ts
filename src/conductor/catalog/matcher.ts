import type { MatchQuery, ModelCardRef } from "../contract.js";
import { toCardRef } from "./catalog.js";
import type { CatalogCard, ModelCatalog } from "./catalog.js";

export type ResolveInput = string | MatchQuery;

type Scored = { card: CatalogCard; score: number; bonus: number };
const SCALE = {
  exactCanonical: 900,
  exactModelId: 800,
  providerScoped: 600,
  globPattern: 400,
  aliasSubstring: 200,
};
const GLOB_CACHE = new Map<string, RegExp>();

function liftQuery(input: ResolveInput): MatchQuery {
  return typeof input === "string" ? { pattern: input } : input;
}

function clearsConstraints(card: CatalogCard, query: MatchQuery): boolean {
  if (query.provider !== undefined && card.provider !== String(query.provider)) return false;
  if (query.modelId !== undefined && card.modelId !== query.modelId) return false;
  if (query.reasoning === true && !card.reasoning) return false;
  if (query.supportsImageInput === true && !card.acceptsImages) return false;
  return true;
}

function looksGlobby(pattern: string): boolean {
  return /[*?[\]]/.test(pattern);
}

function compileGlob(pattern: string): RegExp | undefined {
  const cached = GLOB_CACHE.get(pattern);
  if (cached) return cached;
  let body = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*") body += "[^/]*";
    else if (ch === "?") body += "[^/]";
    else if (ch === "[") {
      const close = pattern.indexOf("]", i + 1);
      if (close === -1) body += "\\[";
      else {
        body += `[${pattern.slice(i + 1, close).replace(/\\/g, "\\\\")}]`;
        i = close;
      }
    } else body += ch.replace(/[.+^${}()|\\]/g, "\\$&");
  }
  try {
    const regexp = new RegExp(`^${body}$`, "i");
    GLOB_CACHE.set(pattern, regexp);
    return regexp;
  } catch {
    return undefined;
  }
}

function probePattern(card: CatalogCard, pattern: string): number {
  const needle = pattern.trim();
  if (needle === "") return 0;
  const folded = needle.toLowerCase();
  if (card.id === needle) return SCALE.exactCanonical;
  if (card.modelId === needle) return SCALE.exactModelId;
  const providerPrefix = `${card.provider}/`;
  if (needle === providerPrefix || folded === card.provider.toLowerCase()) return SCALE.providerScoped;
  if (looksGlobby(needle)) {
    const regexp = compileGlob(needle);
    if (regexp && (regexp.test(card.id) || regexp.test(card.modelId))) return SCALE.globPattern;
  }
  if (card.id.toLowerCase().includes(folded) || card.name.toLowerCase().includes(folded)) return SCALE.aliasSubstring;
  return 0;
}

function tieBonus(card: CatalogCard, pattern: string): number {
  const needle = pattern.trim().toLowerCase();
  let bonus = 0;
  if (needle.length > 0) {
    const slack = Math.abs(card.id.length - needle.length);
    bonus += Math.max(0, 40 - Math.min(slack, 40));
  }
  if (card.reasoning) bonus += 3;
  return bonus;
}

function rankCandidates(a: Scored, b: Scored): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.bonus !== b.bonus) return b.bonus - a.bonus;
  return a.card.id.localeCompare(b.card.id);
}

export class ModelMatcher {
  readonly #catalog: ModelCatalog;

  constructor(catalog: ModelCatalog) { this.#catalog = catalog; }

  resolve(input: ResolveInput): ModelCardRef | undefined {
    const card = this.resolveCard(input);
    return card ? toCardRef(card) : undefined;
  }

  resolveCard(input: ResolveInput): CatalogCard | undefined {
    const query = liftQuery(input);
    if (query.provider !== undefined && query.modelId !== undefined) {
      const pinned = this.#catalog.get(`${String(query.provider)}/${query.modelId}`);
      if (pinned && clearsConstraints(pinned, query)) return pinned;
    }
    const field = this.#catalog.all().filter((card) => clearsConstraints(card, query));
    if (field.length === 0) return undefined;
    const pattern = query.pattern?.trim();
    if (!pattern) return field.find((card) => card.reasoning) ?? field[0];
    const scored: Scored[] = [];
    for (const card of field) {
      const score = probePattern(card, pattern);
      if (score > 0) scored.push({ card, score, bonus: tieBonus(card, pattern) });
    }
    scored.sort(rankCandidates);
    return scored[0]?.card;
  }

  resolveAll(input: ResolveInput): readonly ModelCardRef[] {
    const query = liftQuery(input);
    const field = this.#catalog.all().filter((card) => clearsConstraints(card, query));
    const pattern = query.pattern?.trim();
    if (!pattern) return field.map(toCardRef);
    const scored: Scored[] = [];
    for (const card of field) {
      const score = probePattern(card, pattern);
      if (score > 0) scored.push({ card, score, bonus: tieBonus(card, pattern) });
    }
    scored.sort(rankCandidates);
    return scored.map(({ card }) => toCardRef(card));
  }
}
