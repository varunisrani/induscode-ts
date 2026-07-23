// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Capability catalog — the deck's single source of truth.
 *
 * This module owns {@link CAPABILITY_CARDS}: the one hand-maintained-in-one-place
 * list of {@link CapabilityCard} rows the rest of the deck reads from. Every
 * index, lookup, and profile-membership query is *derived* from this array, so
 * there is never a second parallel map to keep in sync.
 *
 * Right now the catalog is exactly the framework built-ins — read/write/edit/
 * ls/grep/find/bash/process/the checklist pair/web search & fetch — projected
 * out of the single {@link BUILTIN_BRIDGE} table in `builtin-bridge.ts`. As the
 * novel provisioners land (delegate, checklist ledger, daemon proxy, recall,
 * SaaS actions, and the MCP bridge network) their cards are appended here too,
 * so the catalog stays the one place the deck enumerates what tools exist.
 *
 * A {@link CapabilityCard} is metadata plus a builder: the wire-facing id, the
 * deck-side title/summary prose, and a `build(ctx)` that mints the live
 * {@link Capability}. The card does not carry profile membership — that lives in
 * the profile table the provisioner consults — so the card shape stays the small
 * catalog row the contract froze.
 */
import type { CapabilityCard, CapabilityId, CardProfiles } from "./contract";
/**
 * The static capability catalog — the deck's single source of truth.
 *
 * One ordered array of catalog rows. Today every row is a framework built-in,
 * projected from the bridge table; novel-provisioner cards are appended here as
 * they land. Consumers never hand-build a parallel list — they read this array
 * (or the derived {@link CAPABILITY_INDEX} / {@link CARD_PROFILES} below).
 */
export declare const CAPABILITY_CARDS: readonly CapabilityCard[];
/**
 * The catalog keyed by wire-facing {@link CapabilityId}, derived from
 * {@link CAPABILITY_CARDS}. Resolves a `--tools name1,name2` selection or a
 * model-named tool to its card in O(1) without a second hand-maintained map.
 */
export declare const CAPABILITY_INDEX: ReadonlyMap<CapabilityId, CapabilityCard>;
/**
 * Profile membership for every catalog row, keyed by id and derived from the
 * bridge table. The data-driven provisioner intersects this with a requested
 * profile to assemble a session's capability set — no per-profile build
 * functions, just a table walk.
 */
export declare const CARD_PROFILES: ReadonlyMap<CapabilityId, CardProfiles>;
/** The wire-facing ids of every catalog row, in catalog order. */
export declare function capabilityIds(): CapabilityId[];
/** True when a catalog row exists under this id. */
export declare function hasCapability(id: CapabilityId): boolean;
/** Fetch a catalog row by id, or `undefined` when the id is unknown. */
export declare function findCard(id: CapabilityId): CapabilityCard | undefined;
/**
 * The catalog rows that participate in a profile, in catalog order.
 *
 * `all` returns every row; a named profile keeps only the rows whose membership
 * (read from {@link CARD_PROFILES}) admits it. The single place profile
 * filtering happens, so the provisioner stays a thin walk over this result.
 *
 * @param profile the requested deck profile
 */
export declare function cardsForProfile(profile: "authoring" | "survey" | "all"): CapabilityCard[];
