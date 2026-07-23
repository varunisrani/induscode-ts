// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Model catalog — `ModelCatalog`.
 *
 * A transform pipeline over the framework model list. The framework publishes
 * its catalog per provider via `getModels(provider)` from `indusagi/ai`; each
 * entry is a rich {@link Model} record. This module **re-derives** that data
 * into the conductor's own normalized shape — a {@link CatalogCard} — through a
 * validate → normalize → key pipeline, then exposes a small lookup surface
 * (`all`, `byProvider`, `get`) keyed by a canonical `"provider/modelId"` id.
 *
 * This replaces pi's `model-registry` / `ModelRegistry`. It is intentionally
 * *not* a re-export of the framework registry: the field order and shape are
 * the conductor's, the data is run back through a zod gate, and the public
 * methods read differently. The full framework {@link Model} is retained on each
 * card so the conductor can hand a complete model object to the agent without a
 * second registry round-trip.
 */
import { type KnownProvider, type Model } from "indusagi/ai";
import type { ModelCardRef } from "../contract";
/**
 * One normalized entry in the catalog.
 *
 * Extends the lightweight {@link ModelCardRef} identity projection with the
 * extra capability facets the matcher filters on, plus the original framework
 * {@link Model}. `ref` is the slice a UI lists/labels with; `model` is the full
 * record the conductor binds to the agent.
 */
export interface CatalogCard {
    /** Canonical `"provider/modelId"` identifier — the catalog key. */
    readonly id: string;
    /** Owning provider slug. */
    readonly provider: KnownProvider | string;
    /** Provider-scoped model id (e.g. `"claude-sonnet-4"`). */
    readonly modelId: string;
    /** Human-readable display name. */
    readonly name: string;
    /** Whether the model exposes a reasoning/thinking budget. */
    readonly reasoning: boolean;
    /** Whether the model accepts image input. */
    readonly acceptsImages: boolean;
    /** Context window size in tokens (0 when the framework omits it). */
    readonly contextTokens: number;
    /** The framework model record, retained verbatim for binding. */
    readonly model: Model<Model<string>["api"]>;
}
/** Project a {@link CatalogCard} down to its public {@link ModelCardRef} slice. */
export declare function toCardRef(card: CatalogCard): ModelCardRef;
/** Compose the canonical catalog key from a provider + model id. */
export declare function canonicalId(provider: string, modelId: string): string;
/** Injection seam for tests: how the catalog sources its raw data. */
export interface CatalogSource {
    /** Enumerate the providers to scan. */
    readonly providers: () => readonly (KnownProvider | string)[];
    /** Pull the raw model list for one provider. */
    readonly models: (provider: string) => readonly Model<string>[];
}
/**
 * A normalized, validated view of the framework model list.
 *
 * Construct once (the build pipeline runs eagerly in the constructor) and query
 * many times. The instance is immutable after construction; call
 * {@link ModelCatalog.refreshed} to rebuild against the current framework state.
 */
export declare class ModelCatalog {
    #private;
    /**
     * @param source raw-data seam; defaults to the live `indusagi/ai` registry.
     */
    constructor(source?: CatalogSource);
    /** Total number of cards in the catalog. */
    get size(): number;
    /** Every card, in insertion order (provider scan order). */
    all(): readonly CatalogCard[];
    /** Cards owned by one provider (empty array if the provider has none). */
    byProvider(provider: KnownProvider | string): readonly CatalogCard[];
    /** The providers that contributed at least one card, in scan order. */
    providers(): readonly string[];
    /**
     * Look up one card by its canonical `"provider/modelId"` id. Also accepts a
     * bare provider-scoped model id when it is unambiguous across providers.
     */
    get(id: string): CatalogCard | undefined;
    /** True when the canonical id resolves to a card. */
    has(id: string): boolean;
    /** Rebuild against the current framework state, returning a fresh catalog. */
    refreshed(source?: CatalogSource): ModelCatalog;
}
