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
import { unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { atomicWritePrivateFileSync, readPrivateFileSync } from "../security/private-state.js";

/** Root of the indus-server. Used to build the gateway base URL and the device-login endpoints. Any trailing slash(es) are stripped so callers can append paths with a single separator. */
export const INDUS_SERVER_URL: string = process.env.INDUS_SERVER_URL?.replace(/\/+$/, "") ?? "https://indus-server.vercel.app";
/** The app profile directory that holds the server session token. */
export const CONFIG_DIR: string = path.join(os.homedir(), ".indusagi", "agent");
/** Absolute path of the JSON file the session token is persisted to. */
export const TOKEN_FILE: string = path.join(CONFIG_DIR, "server-token.json");

export interface ServerTokenPaths {
  readonly configDir?: string;
  readonly tokenFile?: string;
}

function resolveTokenPaths(paths: ServerTokenPaths = {}): { configDir: string; tokenFile: string } {
  const configDir = paths.configDir ?? CONFIG_DIR;
  return { configDir, tokenFile: paths.tokenFile ?? path.join(configDir, "server-token.json") };
}

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
export async function getServerToken(paths: ServerTokenPaths = {}): Promise<TokenData | null> {
  try {
    const data = readPrivateFileSync(resolveTokenPaths(paths).tokenFile);
    if (data === null) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Persist a session token from a device-flow response, converting the relative
 * `expires_in` (seconds) into an absolute `expires_at` ISO timestamp and
 * defaulting `token_type` to `"Bearer"`. Creates the profile directory if
 * needed and writes the file with owner-only permissions.
 *
 * @param token the device-flow token payload.
 * @returns `true` on success, `false` if the write failed.
 */
export async function storeServerToken(token: ServerTokenInput, paths: ServerTokenPaths = {}): Promise<boolean> {
  try {
    const { tokenFile } = resolveTokenPaths(paths);
    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type ?? "Bearer",
      scope: token.scope,
      expires_at: token.expires_in !== undefined ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
      created_at: new Date().toISOString(),
    };
    atomicWritePrivateFileSync(tokenFile, `${JSON.stringify(tokenData, null, 2)}\n`);
    return true;
  } catch (error) {
    console.error("Failed to store server token:", (error as Error).message);
    return false;
  }
}

/**
 * Remove the stored session token (used by `indus logout`). A missing file is
 * treated as nothing-to-do.
 *
 * @returns `true` when a file was deleted, `false` when none existed / removal failed.
 */
export async function clearServerToken(paths: ServerTokenPaths = {}): Promise<boolean> {
  try {
    await unlink(resolveTokenPaths(paths).tokenFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decide whether a token is expired. A token counts as expired when it is
 * absent, has no `expires_at`, or has under 5 minutes of life remaining (the
 * margin keeps a long turn from racing the expiry boundary).
 *
 * @param token the token to inspect (or `null`).
 * @returns `true` when the token is missing or stale.
 */
export function isServerTokenExpired(token: TokenData | null): boolean {
  if (!token || !token.expires_at) {
    return true;
  }
  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
}

/**
 * Convenience predicate: there is a stored token and it is not expired.
 *
 * @returns `true` when a usable (fresh) session token is on disk.
 */
export async function hasValidServerToken(): Promise<boolean> {
  const token = await getServerToken();
  return token !== null && !isServerTokenExpired(token);
}
