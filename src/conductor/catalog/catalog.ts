import { z } from "zod";
import { getModels, getProviders, modelRegistry } from "indusagi/ai";
import type { KnownProvider, Model } from "indusagi/ai";
import type { ModelCardRef } from "../contract.js";
import { applyCodingAgentModelOverlay } from "../../models.js";

export interface CatalogCard {
  readonly id: string;
  readonly provider: KnownProvider | string;
  readonly modelId: string;
  readonly name: string;
  readonly reasoning: boolean;
  readonly acceptsImages: boolean;
  readonly contextTokens: number;
  readonly model: Model<Model<string>["api"]>;
}

export interface CatalogSource {
  readonly providers: () => readonly (KnownProvider | string)[];
  readonly models: (provider: string) => readonly Model<string>[];
}

const rawModelGate = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  reasoning: z.boolean().optional(),
  input: z.array(z.string()).optional(),
  contextWindow: z.number().optional(),
});

const EXCLUDED_PROVIDERS = new Set(["mock"]);
applyCodingAgentModelOverlay(modelRegistry);
const frameworkSource: CatalogSource = {
  providers: () => getProviders().filter((provider) => !EXCLUDED_PROVIDERS.has(String(provider))),
  models: (provider) => getModels(provider as KnownProvider),
};

export function toCardRef(card: CatalogCard): ModelCardRef {
  return {
    id: card.id,
    provider: card.provider,
    modelId: card.modelId,
    name: card.name,
    reasoning: card.reasoning,
  };
}

export function canonicalId(provider: string, modelId: string): string {
  return `${provider}/${modelId}`;
}

function normalizeCard(raw: Model<string>): CatalogCard {
  const provider = String(raw.provider);
  const modelId = raw.id;
  const inputs = Array.isArray(raw.input) ? raw.input : [];
  return {
    id: canonicalId(provider, modelId),
    provider,
    modelId,
    name: raw.name,
    reasoning: raw.reasoning === true,
    acceptsImages: inputs.includes("image"),
    contextTokens: typeof raw.contextWindow === "number" ? raw.contextWindow : 0,
    model: raw as CatalogCard["model"],
  };
}

function buildIndex(providers: readonly (KnownProvider | string)[], pull: CatalogSource["models"]): Map<string, CatalogCard> {
  const index = new Map<string, CatalogCard>();
  for (const provider of providers) {
    let raws: readonly Model<string>[];
    try {
      raws = pull(String(provider));
    } catch {
      continue;
    }
    for (const raw of raws) {
      if (!rawModelGate.safeParse(raw).success) continue;
      const card = normalizeCard(raw);
      if (!index.has(card.id)) index.set(card.id, card);
    }
  }
  return index;
}

export class ModelCatalog {
  readonly #index: Map<string, CatalogCard>;
  readonly #byProvider: Map<string, CatalogCard[]>;

  constructor(source: CatalogSource = frameworkSource) {
    this.#index = buildIndex(source.providers(), source.models);
    this.#byProvider = new Map();
    for (const card of this.#index.values()) {
      const bucket = this.#byProvider.get(card.provider);
      if (bucket) bucket.push(card);
      else this.#byProvider.set(card.provider, [card]);
    }
  }

  get size(): number { return this.#index.size; }
  all(): readonly CatalogCard[] { return [...this.#index.values()]; }
  byProvider(provider: KnownProvider | string): readonly CatalogCard[] { return this.#byProvider.get(String(provider)) ?? []; }
  providers(): readonly string[] { return [...this.#byProvider.keys()]; }

  get(id: string): CatalogCard | undefined {
    const direct = this.#index.get(id);
    if (direct) return direct;
    if (!id.includes("/")) {
      const matches = [...this.#index.values()].filter((card) => card.modelId === id);
      if (matches.length === 1) return matches[0];
    }
    return undefined;
  }

  has(id: string): boolean { return this.get(id) !== undefined; }
  refreshed(source: CatalogSource = frameworkSource): ModelCatalog { return new ModelCatalog(source); }
}
