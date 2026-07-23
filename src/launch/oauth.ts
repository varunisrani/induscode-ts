// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * OAuth integration — the browser-sign-in counterpart to the api-key flow.
 *
 * The framework ships working sign-in machinery for a handful of providers but
 * leaves its registry empty by default (api-key-only mode). This module turns
 * that on: {@link registerBuiltInOAuthProviders} populates the registry with the
 * three framework providers, and runs once as a side effect of importing the
 * module so that the moment the launch layer loads, the OAuth-capable providers
 * are live.
 *
 * On top of registration it offers three things the credential command needs:
 *   - {@link listLoginProviders} — the merged sign-in directory, every entry
 *     tagged with whether it authenticates by browser sign-in or by api key.
 *   - {@link startOAuthLogin} — drives a framework provider's login flow and
 *     persists the resulting credentials through the {@link AuthVault}.
 *   - {@link openLoginUrl} — a default-browser launcher (per platform) the login
 *     callback uses to send the user to the provider's consent page.
 *
 * No state is held here beyond the framework registry itself; the module is a
 * thin, testable seam over the framework API plus the app's vault.
 */
import { type OAuthLoginCallbacks } from "indusagi/ai";
import type { AuthVault } from "./contract";
/**
 * Register the framework's built-in sign-in providers, idempotently.
 *
 * Each provider is registered only when its id is not already present, so
 * repeated calls (or a re-import) leave the registry unchanged. Returns the ids
 * that are registered after the call, for callers that want to confirm the set.
 */
export declare function registerBuiltInOAuthProviders(): string[];
/**
 * Whether a registered sign-in provider has a *real* OAuth client id wired in
 * (its env var is set to something other than the framework's sentinel), so its
 * browser sign-in can actually complete.
 *
 * Reads the env var live (not at import time) so a deployer that exports the id
 * before launching `/login` is honored. A provider with no known client-id
 * wiring (i.e. not one of the three sentinel-shipped framework providers) is
 * treated as registered — we only gate the providers we know ship a sentinel.
 *
 * @param providerId the registered sign-in provider id
 */
export declare function hasRegisteredOAuthClientId(providerId: string): boolean;
/** How a provider authenticates in the merged sign-in directory. */
export type AuthKind = "oauth" | "apiKey";
/** One row of the merged sign-in directory. */
export interface LoginProvider {
    /** Stable provider id (framework registry id or api-key directory id). */
    readonly id: string;
    /** Human-facing label for menus and prompts. */
    readonly label: string;
    /** Whether this entry signs in via the browser or stores an api key. */
    readonly authKind: AuthKind;
}
/**
 * The merged sign-in directory: every registered browser-sign-in provider plus
 * every api-key provider the app knows, each tagged with its {@link AuthKind}.
 *
 * Browser-sign-in providers lead the list (they are the preferred path for the
 * providers that support them); an api-key provider that shares an id with a
 * registered sign-in provider is still listed, so a user can choose either path
 * for the same underlying account.
 */
export declare function listLoginProviders(): LoginProvider[];
/**
 * Open a sign-in url in the user's default browser.
 *
 * Refuses anything that is not an `http`/`https` url and resolves `false`, so a
 * provider that hands back a non-web redirect never spawns a process. Each
 * strategy is tried in turn; the first one that spawns without an immediate
 * error wins. Resolves `true` if a browser was launched, `false` otherwise.
 */
export declare function openLoginUrl(url: string): Promise<boolean>;
/**
 * The outcome of {@link startOAuthLogin}: the provider and account the
 * credentials were stored under, and whether this account became the default.
 */
export interface OAuthLoginResult {
    /** The provider id the sign-in completed for. */
    readonly provider: string;
    /** The account name the credentials were stored under. */
    readonly account: string;
    /** Whether the new account was stored as the provider default. */
    readonly madeDefault: boolean;
}
/**
 * Drive a framework provider's browser sign-in and persist the result.
 *
 * Looks the provider up in the (now populated) framework registry, runs its
 * login flow with the supplied {@link OAuthLoginCallbacks}, and writes the
 * returned credentials into the {@link AuthVault} under `account`. The first
 * account stored for a provider becomes its default. Throws when the provider id
 * is not registered or the framework login flow rejects.
 *
 * @param providerId the registered sign-in provider id (e.g. the framework id)
 * @param callbacks  the framework login callbacks (url open, prompt, progress)
 * @param vault      the credential store the result is persisted through
 * @param account    the account name to store under (defaults to `"default"`)
 */
export declare function startOAuthLogin(providerId: string, callbacks: OAuthLoginCallbacks, vault: AuthVault, account?: string): Promise<OAuthLoginResult>;
