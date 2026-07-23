// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Model matcher — `ModelMatcher`.
 *
 * A scored-candidate resolver over a {@link ModelCatalog}. Given a free-form
 * query (a string, or a structured {@link MatchQuery}), it produces the single
 * best-matching {@link ModelCardRef}, or `undefined` when nothing clears the bar.
 *
 * It is an independent implementation: resolution is a *prioritized scoring
 * pipeline*, not a chain of single-purpose match helpers with recursive
 * colon-splitting. Each candidate card is scored against the query by a set of
 * independent strategy probes (exact-canonical, exact-id, provider-prefix,
 * alias-substring, glob), the capability filters gate the field, and the highest
 * scorer (with deterministic tie-breaks) wins. Every helper name here is fresh.
 */
import type { MatchQuery, ModelCardRef } from "../contract";
import { type CatalogCard, type ModelCatalog } from "./catalog";
/** Either a raw selector string or the structured {@link MatchQuery}. */
export type ResolveInput = string | MatchQuery;
/**
 * Resolves model queries against a {@link ModelCatalog} by scored candidates.
 *
 * Construct once with a catalog, then call {@link ModelMatcher.resolve} per
 * query. The matcher holds no mutable state; it is safe to share.
 */
export declare class ModelMatcher {
    #private;
    constructor(catalog: ModelCatalog);
    /**
     * Resolve a query to the single best {@link ModelCardRef}, or `undefined`.
     *
     * Pipeline:
     *   1. lift the input to a {@link MatchQuery};
     *   2. honor an explicit `provider`+`modelId` *pin* (highest tier) up front;
     *   3. gate every card through {@link clearsConstraints};
     *   4. with no pattern, return the leading surviving candidate (default pick);
     *   5. otherwise score each survivor via {@link probePattern} + {@link tieBonus}
     *      and return the top scorer (deterministic tie-break by tier, bonus, id).
     */
    resolve(input: ResolveInput): ModelCardRef | undefined;
    /** As {@link resolve}, but returns the full {@link CatalogCard}. */
    resolveCard(input: ResolveInput): CatalogCard | undefined;
    /**
     * Resolve, returning *all* surviving candidates ranked best-first (the field
     * a "did you mean" picker would show). Useful for ambiguous selectors.
     */
    resolveAll(input: ResolveInput): readonly ModelCardRef[];
}
