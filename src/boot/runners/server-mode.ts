/**
 * Boot helper: decide whether a provider runs in **server mode** (Case B).
 *
 * A model turn takes one of three paths (see LOGIN_GATEWAY_PLAN.md §1):
 *   - **A. Local key** — a usable key for the provider is stored in the on-disk
 *     auth vault (or exported in the environment). The framework calls the
 *     provider directly; behaviour is unchanged and this module returns
 *     `{ serverMode: false }`.
 *   - **B. Server tier** — the provider is gateway-eligible, the user has **no**
 *     usable local key, and they hold a **valid server token**. The session token
 *     is vended as the provider "key" and the model is re-routed through the indus
 *     gateway. This module returns `{ serverMode: true, token }`.
 *   - **C. Blocked** — no local key and no valid token: `{ serverMode: false }`
 *     (the resolver then falls through to the framework's own env lookup, which
 *     surfaces the usual "no API key" guidance pointing at `indus login`).
 *
 * The two consumers in {@link file://./session.ts} call this with the SAME
 * `(ctx, provider, vault)` triple so the key-resolver fallback and the
 * gateway-base-url computation always agree on whether server mode is active.
 */
import { INDUS_SERVER_URL, getServerToken, hasValidServerToken } from "../server-token.js";
import type { AuthVault } from "../../launch/contract.js";
import type { BootContext } from "../contract.js";

/**
 * The outcome of {@link resolveServerMode}: whether the provider should route
 * through the gateway this run, and (when so) the session token to hand back as
 * the provider api key.
 */
export interface ServerModeResult {
  /** `true` => bind the gateway base url and use {@link token} as the key. */
  serverMode: boolean;
  /** The session token (`access_token`) to vend as the key, when `serverMode`. */
  token?: string;
}

const GATEWAY_ELIGIBLE_PROVIDERS: ReadonlySet<string> = new Set([
  "minimax",
  "sarvam",
]);

/**
 * Whether `provider` may be routed through the indus gateway. Excludes the
 * non-portable providers (vertex / bedrock / codex) and the deferred opencode
 * `anthropic-messages` api per the §B.4 caveat.
 */
export function isGatewayEligibleProvider(provider: string): boolean {
  return GATEWAY_ELIGIBLE_PROVIDERS.has(provider);
}

/** The server-tier provider slugs (for default-model selection / listing). */
export function serverTierProviders(): readonly string[] {
  return [...GATEWAY_ELIGIBLE_PROVIDERS];
}

async function hasUsableLocalKey(provider: string, vault: AuthVault): Promise<boolean> {
  try {
    const accounts: string[] = [];
    const def = await vault.defaultAccount(provider);
    if (def !== undefined && def.length > 0) accounts.push(def);
    for (const account of await vault.listAccounts(provider)) {
      if (!accounts.includes(account)) accounts.push(account);
    }
    for (const account of accounts) {
      const key = await vault.readUsableKey(provider, account);
      if (typeof key === "string" && key.length > 0) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Decide whether `provider` runs in server mode for this session.
 *
 * Server mode is active when ALL hold:
 *   1. {@link isGatewayEligibleProvider}(provider) — excludes vertex/bedrock/codex
 *      and the deferred opencode `anthropic-messages` api (§B.4);
 *   2. no EXPLICIT local key — the vault holds no usable key for the provider
 *      (an ambient env var is intentionally ignored for server-tier providers);
 *   3. {@link hasValidServerToken}() — a stored, non-expired server token exists.
 *
 * Returns `{ serverMode: false }` whenever any condition fails, so the
 * local-key (Case A) path is preserved byte-for-byte: the resolver then returns
 * `undefined` and no gateway base url is bound.
 *
 * @param _ctx the boot context (reserved for future per-run policy; the vault is
 *   passed explicitly so callers share one instance)
 * @param provider the framework provider slug to evaluate
 * @param vault the on-disk credential vault to probe for a local key
 */
export async function resolveServerMode(_ctx: BootContext, provider: string, vault: AuthVault): Promise<ServerModeResult> {
  if (!isGatewayEligibleProvider(provider)) return { serverMode: false };
  if (await hasUsableLocalKey(provider, vault)) return { serverMode: false };
  if (!(await hasValidServerToken())) return { serverMode: false };
  const token = await getServerToken();
  const access = token?.access_token;
  if (typeof access !== "string" || access.length === 0) return { serverMode: false };
  return { serverMode: true, token: access };
}

/**
 * Build the per-provider gateway base-url map for THIS session: for every
 * gateway-eligible provider currently in server mode (no explicit local key +
 * valid token), map `provider -> ${INDUS_SERVER_URL}/gateway/${provider}`.
 *
 * The conductor consults this map at EVERY model bind — including a runtime
 * `/model` switch — so selecting ANY server-tier model (not just the one the
 * session launched on) routes through the gateway. Empty when nothing qualifies.
 */
export async function resolveServerGatewayUrls(ctx: BootContext, vault: AuthVault): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const provider of GATEWAY_ELIGIBLE_PROVIDERS) {
    const result = await resolveServerMode(ctx, provider, vault);
    if (result.serverMode) {
      map[provider] = `${INDUS_SERVER_URL}/gateway/${provider}`;
    }
  }
  return map;
}
