// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Server-token store — the boot-layer persistence for the indus device-login
 * session token. This is the app side of the login + model-gateway contract: a
 * successful `indus login` device flow writes the better-auth session token
 * here, and the key resolver later reads it back to drive "server mode" (Case B
 * — no local provider key, but a valid server session, so requests are routed
 * through the indus-server gateway with the session token as the api key).
 *
 * The token lives in a single JSON file under the app's profile directory
 * (`~/.indusagi/agent/server-token.json`) — deliberately NOT the framework's
 * `~/.better-auth` location, so the CLI session is isolated from any other
 * tooling. As with the credential vault, the file is tiny and access is
 * interactive, so we read / write the whole file each time and tolerate a
 * missing or malformed file as "no token".
 *
 * Ported from supercli `server/src/lib/token.ts`; the load-bearing detail is the
 * `expires_in` (seconds, from the device-flow response) → `expires_at` (absolute
 * ISO timestamp, on disk) conversion, which lets {@link isServerTokenExpired}
 * decide freshness without re-deriving the clock offset.
 */
/**
 * Root of the indus-server. Used to build the gateway base URL and the
 * device-login endpoints. Any trailing slash(es) are stripped so callers can
 * append paths with a single separator.
 */
export declare const INDUS_SERVER_URL: string;
/** The app profile directory that holds the server session token. */
export declare const CONFIG_DIR: string;
/** Absolute path of the JSON file the session token is persisted to. */
export declare const TOKEN_FILE: string;
/** On-disk token shape (what {@link storeServerToken} writes / {@link getServerToken} returns). */
export interface TokenData {
    /** The better-auth session token, used as the gateway api key in server mode. */
    access_token: string;
    /** Optional refresh token, when the device flow returns one. */
    refresh_token?: string;
    /** Token scheme; defaults to `"Bearer"`. */
    token_type: string;
    /** Optional granted scope string. */
    scope?: string;
    /** Absolute expiry as an ISO string, or null when the token has no expiry. */
    expires_at: string | null;
    /** When this record was written, as an ISO string. */
    created_at: string;
}
/** Device-flow response shape accepted by {@link storeServerToken} (`expires_in` → `expires_at`). */
export interface ServerTokenInput {
    /** The better-auth session token. */
    access_token: string;
    /** Optional refresh token. */
    refresh_token?: string;
    /** Token scheme; defaults to `"Bearer"` when omitted. */
    token_type?: string;
    /** Optional granted scope string. */
    scope?: string;
    /** Lifetime in seconds, relative to now; converted to an absolute `expires_at`. */
    expires_in?: number;
}
/**
 * Read the stored session token, tolerating a missing or malformed file as
 * "no token".
 *
 * @returns the parsed {@link TokenData}, or `null` when nothing is stored.
 */
export declare function getServerToken(): Promise<TokenData | null>;
/**
 * Persist a session token from a device-flow response, converting the relative
 * `expires_in` (seconds) into an absolute `expires_at` ISO timestamp and
 * defaulting `token_type` to `"Bearer"`. Creates the profile directory if
 * needed and writes the file with owner-only permissions.
 *
 * @param token the device-flow token payload.
 * @returns `true` on success, `false` if the write failed.
 */
export declare function storeServerToken(token: ServerTokenInput): Promise<boolean>;
/**
 * Remove the stored session token (used by `indus logout`). A missing file is
 * treated as nothing-to-do.
 *
 * @returns `true` when a file was deleted, `false` when none existed / removal failed.
 */
export declare function clearServerToken(): Promise<boolean>;
/**
 * Decide whether a token is expired. A token counts as expired when it is
 * absent, has no `expires_at`, or has under 5 minutes of life remaining (the
 * margin keeps a long turn from racing the expiry boundary).
 *
 * @param token the token to inspect (or `null`).
 * @returns `true` when the token is missing or stale.
 */
export declare function isServerTokenExpired(token: TokenData | null): boolean;
/**
 * Convenience predicate: there is a stored token and it is not expired.
 *
 * @returns `true` when a usable (fresh) session token is on disk.
 */
export declare function hasValidServerToken(): Promise<boolean>;
