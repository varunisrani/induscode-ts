// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Login command — `runLogin`.
 *
 * The top-level `login` / `logout` / `whoami` surface that authenticates the CLI
 * against the indus-server so a user with **no local provider key** can still run
 * model turns through the server gateway (the session token is vended as the
 * provider key downstream — see `src/boot/runners/server-mode.ts`).
 *
 * `login` drives the OAuth 2.0 **device-authorization** flow (RFC 8628) against
 * the server's better-auth endpoints under `${INDUS_SERVER_URL}/api/auth`:
 *
 *   1. POST `/api/auth/device/code` → a `user_code` + verification URL.
 *   2. The user opens the URL in a browser and approves the device.
 *   3. We poll POST `/api/auth/device/token` until it returns an `access_token`.
 *   4. The token is persisted via {@link storeServerToken} (A1's token store).
 *
 * This is a **pre-pipeline router**, not a runner: a no-key user cannot build a
 * session, so login must short-circuit before the stage pipeline. {@link runLogin}
 * therefore mirrors `runCredential` in `boot.ts` — it owns the first positional
 * token only and returns `undefined` (fall through to a normal launch) when that
 * token is not one of its verbs.
 *
 * The app does not depend on `better-auth/client`, `open`, or a spinner library,
 * so the device flow is implemented over raw `fetch` and the console is driven
 * with `chalk` to match the rest of the launch surface. `--server-url` and
 * `--client-id` are parsed from the argv tail here (the declarative flag table is
 * for the launch invocation, not these auth-only verbs).
 */
import type { OAuthLoginCallbacks } from "indusagi/ai";
import type { BootContext } from "../boot/contract";
/**
 * The sign-in directory id for the indus-server session (as opposed to a
 * per-model-provider credential). Used by `src/launch/oauth.ts` to special-case
 * this entry in `listLoginProviders` / `startOAuthLogin` so the interactive
 * `/login` picker can drive the same device-authorization flow as the `indus
 * login` CLI verb.
 */
export declare const SERVER_TIER_PROVIDER_ID = "indus-server";
/**
 * Drive the indus-server device-authorization flow through the framework's
 * generic {@link OAuthLoginCallbacks} shape, so the interactive `/login` picker
 * (`src/console/overlays/auth.tsx`'s `OAuthFlowDialog`) can establish a
 * server-tier session the same way the `indus login` CLI verb does.
 *
 * Reuses the private {@link requestDeviceCode} / {@link pollForToken} helpers
 * above rather than duplicating the request+poll sequence, and reports the
 * verification URL / code through `callbacks.onAuth` exactly once, mirroring
 * how `doLogin` renders them to the console. On success the token is persisted
 * via {@link storeServerToken}; any thrown error (network failure, denial,
 * expiry, timeout) propagates to the caller unchanged — `startOAuthLogin`'s
 * caller (the dialog's try/catch) already renders a generic failure state.
 *
 * @param callbacks the framework's OAuth login callbacks (url + progress)
 * @param serverUrl the indus-server base url (defaults to {@link INDUS_SERVER_URL})
 * @param clientId  the device-flow client id (defaults to {@link INDUS_CLIENT_ID})
 */
export declare function runServerTierLogin(callbacks: OAuthLoginCallbacks, serverUrl?: string, clientId?: string): Promise<void>;
/**
 * Route a `login` / `logout` / `whoami` verb, if this invocation is one.
 *
 * Inspects `ctx.argv[0]`: returns a numeric exit code when it handled one of the
 * auth verbs, or `undefined` when the leading token is something else so the
 * caller falls through to a normal launch. Modeled on `runCredential` in
 * `boot.ts`; `--server-url` / `--client-id` are parsed from the argv tail.
 *
 * @param ctx the seeded boot context (carries the raw argv)
 */
export declare function runLogin(ctx: BootContext): Promise<number | undefined>;
