// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Shared "does the user have a usable credential for this provider" probe.
 *
 * Used anywhere the console needs to know which providers are actually
 * callable — the `/model` picker (only list authenticated providers) and the
 * banner's Session panel (don't display an unauthenticated model as if it were
 * ready to use) both need the exact same answer, so it lives here once.
 */
import type { OverlayServices } from "./contract";
/**
 * Load the set of provider ids the user has USABLE credentials for, live, so a
 * mid-session `/login` (either a local vault sign-in or the "Indus Server"
 * server-tier device flow) is reflected without a restart.
 *
 * Two independent sources count: (1) any saved account in the local vault for a
 * provider `listLoginProviders()` names, and (2) a valid server session token,
 * which makes every gateway-eligible provider (`serverTierProviders()` —
 * minimax, sarvam) usable even though the server tier never writes into the
 * vault. Returns `null` until the asynchronous probe settles.
 *
 * `refreshKey` re-runs the probe whenever it changes by reference/value — a
 * short-lived overlay (the `/model` picker) can leave it at its default since
 * it remounts fresh on every open anyway, but a component mounted once for the
 * whole session (the banner, the status bar) MUST pass something that changes
 * right when a sign-in completes (e.g. the console's current status toast),
 * otherwise this only ever reflects whatever was true at session start.
 */
export declare function useAuthenticatedProviders(services: OverlayServices | undefined, refreshKey?: unknown): Set<string> | null;
