// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Model catalog printer — `printModelCatalog`.
 *
 * Renders the available models as a padded text table. The data comes from the
 * framework {@link ModelRegistry} (via its `getModels` per provider); this module
 * re-derives the rows it needs, applies a plain case-insensitive
 * {@link CatalogFilter}, sorts by provider then model id, and lays the result out
 * as aligned columns with a Title-Case header and a rule row beneath it.
 *
 * Filtering is a literal substring test — no fuzzy matcher, no external ranking.
 * The column set (provider, model, context window, max output, thinking, images)
 * is the established model-table shape; only the headers and ordering are this
 * module's own.
 */
import { ModelRegistry, type KnownProvider, type Model } from "indusagi/ai";
import type { CatalogFilter } from "./contract";
/**
 * The minimal sink the catalog prints onto. A test captures the lines into an
 * array; production passes a writer over `process.stdout`.
 */
export interface CatalogIo {
    /** Emit one line of table text. */
    print(line: string): void;
}
/** The default {@link CatalogIo} backed by `process.stdout`. */
export declare function defaultCatalogIo(): CatalogIo;
/**
 * The seam the catalog sources its raw models from. Defaults to a fresh
 * framework {@link ModelRegistry}; tests inject a stand-in to drive the layout
 * deterministically.
 */
export interface CatalogModelSource {
    /** Enumerate the providers to scan. */
    providers(): readonly (KnownProvider | string)[];
    /** Pull every model for one provider. */
    models(provider: string): readonly Model<Model<string>["api"]>[];
}
/** Build a {@link CatalogModelSource} over a framework {@link ModelRegistry}. */
export declare function registrySource(registry?: ModelRegistry): CatalogModelSource;
/**
 * Print the model catalog table.
 *
 * Pulls every model from the framework registry, applies {@link filter}, sorts,
 * and writes the aligned table through {@link io}. When the filter matches
 * nothing, a single explanatory line is printed instead of an empty table.
 *
 * @param io     the line sink (defaults to `process.stdout`)
 * @param filter optional provider / capability / substring narrowing
 * @param source optional model source (defaults to the live framework registry)
 */
export declare function printModelCatalog(io?: CatalogIo, filter?: CatalogFilter, source?: CatalogModelSource): void;
