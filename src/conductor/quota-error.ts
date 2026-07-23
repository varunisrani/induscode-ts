// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * quota-error.ts — maps the indus model-gateway's usage-limit response into a
 * friendly, user-facing fault message.
 *
 * When a no-local-key, logged-in user runs a turn, the framework adapter is
 * pointed at `${INDUS_SERVER_URL}/gateway/<provider>` (see the conductor's
 * baseUrl rewrite). If that user is over their monthly token allowance, the
 * server replies — *before* forwarding upstream — with:
 *
 *   HTTP/1.1 429 Too Many Requests
 *   Content-Type: application/json
 *
 *   { "error": "quota_exceeded", "used": <number>, "limit": <number> }
 *
 * The provider SDK / raw-fetch adapter turns that 429 into a thrown error. By
 * the time it reaches the conductor it may be wrapped (an SDK `APIError`, a
 * generic `Error`, a nested `cause` chain, or a plain string), so detection must
 * be tolerant and walk the whole error chain rather than trust a single shape.
 *
 * This module is intentionally transport-agnostic and dependency-free so it can
 * be unit-tested in isolation and imported from the conductor's retry chokepoint
 * without pulling in any network/runtime modules.
 */
/** Detects the gateway's 429 quota body anywhere in the error chain. */
export declare function isQuotaFault(error: unknown): boolean;
/**
 * Friendly user-facing text; `undefined` if `error` is not a quota fault.
 *
 * Includes the `<used>/<limit>` parenthetical when both numbers are parseable,
 * and otherwise falls back to the same sentence without it. The `indus signin
 * <provider>` hint steers the user toward supplying their own key (which takes
 * the direct, un-metered local-key path), and the upgrade hint covers raising
 * the server-side allowance.
 */
export declare function quotaErrorMessage(error: unknown): string | undefined;
