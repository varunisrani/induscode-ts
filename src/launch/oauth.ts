/**
 * OAuth integration — the browser-sign-in counterpart to the api-key flow.
 */
import { spawn } from "node:child_process";
import {
  anthropicOAuthProvider,
  getOAuthProvider,
  getOAuthProviders,
  githubCopilotOAuthProvider,
  openaiCodexOAuthProvider,
  registerOAuthProvider,
  type OAuthLoginCallbacks,
} from "indusagi/ai";
import type { AuthVault } from "./contract.js";
import { SERVER_TIER_PROVIDER_ID, runServerTierLogin } from "./login.js";

const BUILT_IN_OAUTH: { provider: { id: string; name: string }; label: string }[] = [
  { provider: anthropicOAuthProvider, label: "Anthropic (Claude sign-in)" },
  { provider: openaiCodexOAuthProvider, label: "OpenAI (ChatGPT sign-in)" },
  { provider: githubCopilotOAuthProvider, label: "GitHub Copilot" },
];

const OAUTH_LABELS: Record<string, string> = Object.fromEntries(
  BUILT_IN_OAUTH.map((entry) => [entry.provider.id, entry.label]),
);

/**
 * Register the framework's built-in sign-in providers, idempotently.
 */
export function registerBuiltInOAuthProviders(): string[] {
  for (const { provider } of BUILT_IN_OAUTH) {
    if (getOAuthProvider(provider.id) === undefined) {
      registerOAuthProvider(provider);
    }
  }
  return getOAuthProviders().map((provider) => provider.id);
}

registerBuiltInOAuthProviders();

const OAUTH_CLIENT_ID_WIRING: Record<string, { envVar: string; sentinel: string }> = {
  anthropic: {
    envVar: "INDUSAGI_ANTHROPIC_OAUTH_CLIENT_ID",
    sentinel: "<UNREGISTERED-ANTHROPIC-OAUTH-APP>",
  },
  "github-copilot": {
    envVar: "INDUSAGI_GITHUB_COPILOT_CLIENT_ID",
    sentinel: "<UNREGISTERED-COPILOT-APP>",
  },
};

/**
 * Whether a registered sign-in provider has a *real* OAuth client id wired in.
 */
export function hasRegisteredOAuthClientId(providerId: string): boolean {
  const wiring = OAUTH_CLIENT_ID_WIRING[providerId];
  if (wiring === undefined) return true;
  const value = process.env[wiring.envVar];
  return value !== undefined && value.length > 0 && value !== wiring.sentinel;
}

function oauthClientIdEnvVar(providerId: string): string | undefined {
  return OAUTH_CLIENT_ID_WIRING[providerId]?.envVar;
}

export type AuthKind = "oauth" | "apiKey";

export interface LoginProvider {
  readonly id: string;
  readonly label: string;
  readonly authKind: AuthKind;
}

interface ProviderDirectoryEntry {
  readonly id: string;
  readonly label: string;
  readonly envKey: string;
  readonly docsUrl: string;
}

import { PROVIDER_DIRECTORY } from "./credentials.js";

/**
 * The merged sign-in directory.
 */
export function listLoginProviders(): LoginProvider[] {
  const serverTier: LoginProvider = {
    id: SERVER_TIER_PROVIDER_ID,
    label: "Indus Server (sign in for server-tier model access)",
    authKind: "oauth",
  };
  const oauth = getOAuthProviders().map((provider) => ({
    id: provider.id,
    label: OAUTH_LABELS[provider.id] ?? provider.name,
    authKind: "oauth" as const,
  }));
  const apiKey = (PROVIDER_DIRECTORY as readonly ProviderDirectoryEntry[]).map((entry) => ({
    id: String(entry.id),
    label: entry.label,
    authKind: "apiKey" as const,
  }));
  return [serverTier, ...oauth, ...apiKey];
}

function isWebUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface LaunchAttempt {
  command: string;
  args: string[];
}

export function launchAttempts(url: string, platform: NodeJS.Platform = process.platform): LaunchAttempt[] {
  switch (platform) {
    case "darwin":
      return [{ command: "open", args: [url] }];
    case "win32":
      return [{ command: "rundll32.exe", args: ["url.dll,FileProtocolHandler", url] }];
    default:
      return [
        { command: "xdg-open", args: [url] },
        { command: "x-www-browser", args: [url] },
        { command: "google-chrome", args: [url] },
        { command: "chromium", args: [url] },
      ];
  }
}

/**
 * Open a sign-in url in the user's default browser.
 */
export function openLoginUrl(url: string): Promise<boolean> {
  if (!isWebUrl(url)) return Promise.resolve(false);
  const attempts = launchAttempts(url);
  const tryAt = (index: number): Promise<boolean> => {
    if (index >= attempts.length) return Promise.resolve(false);
    const { command, args } = attempts[index];
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean): void => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      try {
        const child = spawn(command, [...args], {
          stdio: "ignore",
          windowsHide: true,
        });
        child.once("error", () => finish(false));
        child.once("spawn", () => {
          child.unref();
          finish(true);
        });
      } catch {
        finish(false);
      }
    }).then((ok) => (ok ? true : tryAt(index + 1)));
  };
  return tryAt(0);
}

export interface OAuthLoginResult {
  readonly provider: string;
  readonly account: string;
  readonly madeDefault: boolean;
}

/**
 * Drive a framework provider's browser sign-in and persist the result.
 */
export async function startOAuthLogin(
  providerId: string,
  callbacks: OAuthLoginCallbacks,
  vault: AuthVault,
  account: string = "default",
): Promise<OAuthLoginResult> {
  if (providerId === SERVER_TIER_PROVIDER_ID) {
    await runServerTierLogin(callbacks);
    return { provider: providerId, account, madeDefault: true };
  }
  const provider = getOAuthProvider(providerId);
  if (provider === undefined) {
    throw new Error(`No browser sign-in is available for "${providerId}".`);
  }
  if (!hasRegisteredOAuthClientId(providerId)) {
    const envVar = oauthClientIdEnvVar(providerId);
    const hint =
      envVar !== undefined ? `set ${envVar} and restart` : "configure its OAuth client id";
    throw new Error(`Browser sign-in for "${providerId}" is not configured: ${hint}.`);
  }
  callbacks.signal?.throwIfAborted();
  const credentials = await provider.login(callbacks);
  callbacks.signal?.throwIfAborted();
  const existing = await vault.listAccounts(providerId);
  callbacks.signal?.throwIfAborted();
  const madeDefault = existing.length === 0;
  await vault.putOAuth(providerId, account, credentials, madeDefault);
  return { provider: providerId, account, madeDefault };
}