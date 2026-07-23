// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Built-in capability bridge — ONE seam to the framework's native tools.
 *
 * The framework (`indusagi/agent`, the `actions` surface) already authors its
 * file, search, shell, web, process, and checklist tools as fully-formed
 * `AgentTool` objects and ships a `create<Name>Tool(cwd, options)` factory for
 * each. This module is the single place the deck reaches across that seam: it
 * pairs every native factory with a deck {@link CapabilityCard.build} closure so
 * the whole framework tool set is re-exposed as {@link Capability} rows in one
 * file rather than in a dozen one-line re-export stubs.
 *
 * What this buys the rest of the deck:
 *   - {@link BUILTIN_BRIDGE} — a single record keyed by the wire-facing tool
 *     name, each value a {@link BridgeBuilder} that mints the live capability for
 *     a {@link DeckContext}. The manifest derives its catalog rows from this
 *     record; nothing else hand-maintains a parallel list of built-ins.
 *   - {@link buildBuiltin} — resolve-and-build one built-in by id, surfacing a
 *     typed {@link DeckFault} on an unknown id or a builder throw.
 *   - {@link BUILTIN_PROFILES} — the per-built-in profile membership the
 *     data-driven provisioner intersects with a requested {@link DeckProfile},
 *     so the survey (observe-only) set falls out of one table instead of a
 *     second hand-written tool list.
 *
 * Design notes:
 *   - The builders thread `ctx.cwd` (and, where a factory takes them, the
 *     framework option bags) into the native factory. They never reimplement the
 *     tool — the framework owns the read/edit/grep/bash/etc. behavior; the bridge
 *     only *binds* it to a working context and re-labels it for the catalog.
 *   - The process and checklist tools are stateful framework singletons exposed
 *     through their factories; the bridge keeps them framework-backed (wrapping
 *     the framework, not any third-party package) while presenting them as plain
 *     capabilities to the deck.
 *   - All model-facing tool `name` strings are the framework's own wire contract
 *     (`read`, `bash`, `grep`, …) and are kept verbatim — the model's prompt and
 *     the conductor key off them. Only the deck-side titles/summaries are the
 *     deck's own prose.
 */
import { type AnyCapability, type Capability, type CapabilityId, type CardProfiles, type DeckContext } from "./contract";
/**
 * A closure that mints one framework built-in {@link Capability} for a working
 * context. The deck's view of a native factory after the bridge has bound the
 * `cwd` (and any option bag) the factory needs.
 *
 * Returns `AnyCapability` because the heterogeneous built-ins carry different
 * parameter schemas; a typed `AgentTool<TSchema>` widens to this element type,
 * which is exactly what the deck and the conductor consume.
 */
export type BridgeBuilder = (ctx: DeckContext) => AnyCapability;
/**
 * One descriptor in the built-in catalog: the wire-facing id, the deck-side
 * title/summary prose, the profiles the tool participates in, and the
 * {@link BridgeBuilder} that binds the framework factory to a context.
 *
 * The manifest turns each of these into a {@link CapabilityCard}; consumers that
 * want the raw built-in set read {@link BUILTIN_BRIDGE} directly.
 */
export interface BuiltinDescriptor {
    /** Wire-facing tool name the model invokes (framework contract, verbatim). */
    readonly id: CapabilityId;
    /** Short human-facing title for catalogs and help text. */
    readonly title: string;
    /** One-line description in the deck's own voice. */
    readonly summary: string;
    /** Which deck profiles this built-in belongs to. */
    readonly profiles: CardProfiles;
    /** Bind the framework factory to a working context. */
    readonly build: BridgeBuilder;
}
/**
 * The framework built-ins keyed by their wire-facing {@link CapabilityId} — the
 * single record the manifest and provisioner read from.
 *
 * Derived from {@link BUILTIN_DESCRIPTORS}, so the keyed view and the ordered
 * list never drift: there is exactly one place a built-in is declared.
 */
export declare const BUILTIN_BRIDGE: Readonly<Record<string, BuiltinDescriptor>>;
/**
 * The wire-facing ids of every framework built-in, in catalog order. Convenient
 * for `--tools` style selection and for the manifest's projection.
 */
export declare const BUILTIN_IDS: readonly CapabilityId[];
/**
 * The profile membership of every built-in, keyed by id — the slice of the
 * profile table the data-driven provisioner reads to decide which built-ins a
 * requested {@link DeckProfile} includes.
 */
export declare const BUILTIN_PROFILES: Readonly<Record<string, CardProfiles>>;
/**
 * The ordered list of built-in descriptors — the manifest projects its catalog
 * rows from this, preserving order.
 */
export declare function builtinDescriptors(): readonly BuiltinDescriptor[];
/**
 * Resolve a built-in by id and build its live capability for a context.
 *
 * Throws a typed {@link DeckFault}: `unknown_capability` when the id is not a
 * framework built-in, or `build_failed` when the framework factory throws. This
 * is the sanctioned entry point so failure shaping stays uniform across the deck.
 *
 * @param id   the wire-facing built-in name to build
 * @param ctx  the working context to bind the factory to
 */
export declare function buildBuiltin(id: CapabilityId, ctx: DeckContext): Capability;
/**
 * Build every framework built-in eligible for a profile, bound to a context.
 *
 * Walks the bridge table once, keeps each built-in whose profile membership
 * admits the requested profile (`all` admits everything), and binds it. A single
 * data-driven pass replaces a trio of per-profile build functions.
 *
 * @param profile the requested deck profile
 * @param ctx     the working context to bind each factory to
 */
export declare function buildBuiltinsForProfile(profile: "authoring" | "survey" | "all", ctx: DeckContext): AnyCapability[];
