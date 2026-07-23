// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Model catalog subsystem — public barrel.
 *
 * Bundles the {@link ModelCatalog} (a normalized, validated transform over the
 * framework model list) and the {@link ModelMatcher} (a scored-candidate query
 * resolver). Consumers import both — plus the {@link CatalogCard} shape and the
 * `canonicalId` / `toCardRef` helpers — from `src/conductor/catalog` rather than
 * reaching into the individual modules.
 *
 * This pairing replaces pi's `model-registry` + `model-resolver`; the catalog
 * key, card shape, and resolution algorithm are all the conductor's own.
 */
export { ModelCatalog, canonicalId, toCardRef, type CatalogCard, type CatalogSource, } from "./catalog";
export { ModelMatcher, type ResolveInput, } from "./matcher";
