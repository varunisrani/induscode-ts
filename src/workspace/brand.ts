// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Brand record — the single source of truth for every identity literal.
 *
 * One frozen {@link Brand} value. Nothing else in the app hard-codes the
 * product name, the profile-directory leaf, the bin names, the env-var
 * namespace, or the share-viewer origin. A rebrand edits this record and
 * nothing else.
 *
 * Shape is dictated by the boot contract ({@link Brand}); the *values* are the
 * indusagi identity.
 */
import type { Brand } from "../boot/contract";
/**
 * The concrete indusagi identity.
 *
 * Frozen at module scope so the record cannot be mutated by any consumer, and
 * typed `satisfies Brand` so a drift from the contract is a compile error here
 * rather than a runtime surprise downstream.
 */
export declare const BRAND: Brand;
/**
 * The product version — printed by `--version` and shown on the startup banner.
 * Single source of truth: bump this one line per release. Co-located with the
 * brand so `boot` reads it without importing the index barrel.
 */
export declare const VERSION = "0.2.4";
