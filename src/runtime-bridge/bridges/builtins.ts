// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Built-in external-runtime catalog — the shipped {@link ExternalRuntimeSpec}
 * entries and the helper that *annotates* a model with one.
 *
 * The model catalog (Phase 2, `src/conductor/catalog`) owns the {@link Model}
 * list; this layer never re-catalogues. Instead it carries a small table of the
 * three runtimes this build ships and a single sanctioned way to stamp a runtime
 * onto a model: rewrite the model's `baseUrl` to the synthetic
 * `bridge:<adapter>` endpoint (so a card has a stable, non-HTTP address) and
 * return the runtime annotation alongside it.
 *
 * Why a `baseUrl` rewrite rather than a new field on the card: the catalog card
 * shape is frozen by Phase 2 and the framework {@link Model} has a fixed shape;
 * the `bridge:<adapter>` convention lets a routing consumer recognize a
 * runtime-backed model purely from its address (`baseUrl.startsWith(scheme)`),
 * with the full spec resolved from this table — no schema change to the catalog.
 */
import type { CatalogCard } from "../../conductor/catalog";
import { type Api, type ExternalRuntimeSpec, type Model, type RuntimeAdapterId } from "../contract";
/**
 * The three runtimes this build ships, keyed by adapter id.
 *
 * Each is `external-cli` (the spawned child owns its own login), so a model
 * bound to one is offered as available with an empty credential vault. The
 * `binaryPath` names the default executable the broker launches when a model's
 * spec does not override it; `args` are extra flags prepended ahead of the
 * bridge's own protocol flags.
 */
export declare const BUILTIN_RUNTIME_SPECS: Readonly<Record<RuntimeAdapterId, ExternalRuntimeSpec>>;
/** The shipped adapter ids, in catalog order. */
export declare const BUILTIN_ADAPTERS: readonly RuntimeAdapterId[];
/** Look up a shipped {@link ExternalRuntimeSpec} by adapter id (`undefined` if none). */
export declare function builtinRuntimeSpec(adapter: RuntimeAdapterId): ExternalRuntimeSpec | undefined;
/**
 * A model annotated with its external runtime: the rewritten framework model
 * (its `baseUrl` now the `bridge:<adapter>` synthetic endpoint) paired with the
 * resolved {@link ExternalRuntimeSpec}. This is the value a routing consumer
 * stores in its side table keyed by canonical id.
 */
export interface RuntimeAnnotatedModel {
    /** The framework model with its `baseUrl` rewritten to the synthetic endpoint. */
    readonly model: Model<Api>;
    /** The runtime spec the {@link RuntimeBroker} drives this model through. */
    readonly spec: ExternalRuntimeSpec;
}
/**
 * Rewrite a framework {@link Model}'s `baseUrl` to the synthetic
 * `bridge:<adapter>` endpoint for `spec.adapter`. Returns a fresh model; the
 * input is never mutated.
 */
export declare function withRuntimeEndpoint(model: Model<Api>, spec: ExternalRuntimeSpec): Model<Api>;
/**
 * Annotate one {@link CatalogCard} with a runtime spec.
 *
 * Resolves the spec from `spec` when given explicitly, else from the shipped
 * table by `adapter`. Returns the card's framework model rewritten to the
 * synthetic endpoint plus the resolved spec, or `undefined` when no spec is
 * known for `adapter` (so a caller can skip non-runtime adapters).
 *
 * @param card    the catalog card whose model to annotate
 * @param adapter the runtime adapter to bind the model to
 * @param spec    an explicit spec override; defaults to the shipped one
 */
export declare function annotateCard(card: CatalogCard, adapter: RuntimeAdapterId, spec?: ExternalRuntimeSpec): RuntimeAnnotatedModel | undefined;
/**
 * Decode the runtime annotation off a framework {@link Model}, the inverse of
 * {@link withRuntimeEndpoint}. Returns the shipped {@link ExternalRuntimeSpec}
 * for the adapter named in a `bridge:<adapter>` `baseUrl`, or `undefined` when
 * the model is a plain HTTP-provider model (its `baseUrl` is a real URL) or the
 * named adapter is not a shipped runtime.
 *
 * This is the lookup a {@link RuntimeBroker} uses to recognize a runtime-backed
 * model purely from its address.
 *
 * @param model the model whose `baseUrl` to inspect
 */
export declare function specFromModel(model: Model<Api>): ExternalRuntimeSpec | undefined;
