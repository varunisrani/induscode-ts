// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Disk-backed credential vault — the boot-layer adapter that satisfies the
 * launch {@link AuthVault} seam so the credential command can persist
 * credentials before the concrete Phase-2 multi-account vault lands.
 *
 * The store is a single JSON file (`auth.json` under the profile directory),
 * keyed provider → account → record. Each record is a discriminated union: it
 * holds *either* a stored api key *or* a set of browser-sign-in credentials, plus
 * a default marker. The adapter is deliberately small and self-contained: it
 * reads / writes the whole file each time (the file is tiny and the operations
 * are interactive, so atomic-rewrite simplicity beats incremental I/O).
 *
 * Two kinds of read are offered. The default-account lookup is plain bookkeeping;
 * {@link AuthVault.readUsableKey} resolves a record to a live api-key string — for
 * an api-key record it returns the stored key verbatim, and for a browser-sign-in
 * record it asks the framework to refresh an expired token (persisting the
 * rotated credentials back to disk) before handing back the usable key.
 *
 * This is *not* the Phase-2 vault — it is the minimal real persistence the
 * launch wiring needs. When the concrete multi-account vault arrives it replaces
 * this adapter at the one call site in {@link "./boot"}.
 */
import type { AuthVault } from "../launch";
/**
 * Build a disk-backed {@link AuthVault} persisting to `authPath`.
 *
 * @param authPath absolute path of the JSON credential store (e.g. `auth.json`)
 */
export declare function createAuthVault(authPath: string): AuthVault;
