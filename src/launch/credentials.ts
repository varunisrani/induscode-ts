/**
 * Credential command — `runCredentialCommand`.
 *
 * The top-level `signin` / `signout` surface. Sign-in supports two methods: a
 * browser sign-in (OAuth) for the providers the framework registry exposes, and
 * an api-key flow for every provider in the directory.
 */
import { createInterface } from "node:readline/promises";
import { getEnvApiKey, getOAuthProvider } from "indusagi/ai";
import {
  type CredentialCommandOptions,
  type CredentialFault,
  type CredentialVerb,
  type ProviderEntry,
  credentialFault,
} from "./contract.js";
import { listLoginProviders, openLoginUrl, startOAuthLogin } from "./oauth.js";

export interface CredentialIo {
  print(line: string): void;
  ask(prompt: string): Promise<string>;
  askSecret(prompt: string): Promise<string>;
}

/**
 * The default {@link CredentialIo} backed by `process.stdout` and a
 * `node:readline/promises` interface.
 */
export function defaultCredentialIo(): CredentialIo {
  return {
    print(line: string): void {
      process.stdout.write(line.endsWith("\n") ? line : `${line}\n`);
    },
    async ask(prompt: string): Promise<string> {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        return (await rl.question(prompt)).trim();
      } finally {
        rl.close();
      }
    },
    async askSecret(prompt: string): Promise<string> {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const out = process.stdout;
      let muted = false;
      const original = out.write.bind(out);
      out.write = ((chunk: string | Uint8Array, ...args: unknown[]): boolean => {
        if (muted && typeof chunk === "string") return true;
        return (original as (chunk: string | Uint8Array, ...rest: unknown[]) => boolean)(chunk, ...args);
      }) as typeof out.write;
      try {
        const ask = rl.question(prompt);
        muted = true;
        const value = await ask;
        return value.trim();
      } finally {
        muted = false;
        out.write = original;
        out.write("\n");
        rl.close();
      }
    },
  };
}

export const PROVIDER_DIRECTORY: readonly ProviderEntry[] = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    envKey: "ANTHROPIC_API_KEY",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "google",
    label: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    envKey: "XAI_API_KEY",
    docsUrl: "https://console.x.ai",
  },
  {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_API_KEY",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    id: "cerebras",
    label: "Cerebras",
    envKey: "CEREBRAS_API_KEY",
    docsUrl: "https://cloud.cerebras.ai",
  },
  {
    id: "mistral",
    label: "Mistral",
    envKey: "MISTRAL_API_KEY",
    docsUrl: "https://console.mistral.ai/api-keys",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "minimax",
    label: "MiniMax",
    envKey: "MINIMAX_API_KEY",
    docsUrl: "https://www.minimax.io",
  },
  {
    id: "kimi",
    label: "Kimi (Moonshot)",
    envKey: "MOONSHOT_API_KEY",
    docsUrl: "https://platform.moonshot.ai/console/api-keys",
  },
  {
    id: "sarvam",
    label: "Sarvam",
    envKey: "SARVAM_API_KEY",
    docsUrl: "https://dashboard.sarvam.ai",
  },
  {
    id: "krutrim",
    label: "Krutrim",
    envKey: "KRUTRIM_API_KEY",
    docsUrl: "https://cloud.olakrutrim.com",
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    envKey: "NVIDIA_API_KEY",
    docsUrl: "https://build.nvidia.com",
  },
  {
    id: "zai",
    label: "Z.ai",
    envKey: "ZAI_API_KEY",
    docsUrl: "https://z.ai",
  },
];

export function findProvider(id: string): ProviderEntry | undefined {
  const needle = id.trim().toLowerCase();
  return PROVIDER_DIRECTORY.find((p) => String(p.id).toLowerCase() === needle);
}

export type SigninMethod = "oauth" | "api-key";

export function asSigninMethod(value: string | undefined): SigninMethod | undefined {
  const normalised = value?.trim().toLowerCase();
  if (normalised === "oauth") return "oauth";
  if (normalised === "api-key" || normalised === "apikey") return "api-key";
  return undefined;
}

export function isOAuthCapable(id: string): boolean {
  return getOAuthProvider(id) !== undefined;
}

const MIN_KEY_LENGTH = 20;
const MAX_ACCOUNT_LENGTH = 50;
const ACCOUNT_PATTERN = /^[A-Za-z0-9_-]+$/;
const PLACEHOLDER_MARKERS = [
  "your-api-key",
  "your_api_key",
  "xxxx",
  "placeholder",
  "changeme",
  "<",
];

/**
 * Validate an api key against the format rules.
 */
export function validateApiKey(key: string): CredentialFault | undefined {
  const trimmed = key.trim();
  if (trimmed.length === 0) {
    return credentialFault("invalid-key", "No api key was provided.", {
      hint: "Paste the key from the provider dashboard and try again.",
    });
  }
  if (trimmed.length < MIN_KEY_LENGTH) {
    return credentialFault(
      "invalid-key",
      `The api key is too short (expected at least ${MIN_KEY_LENGTH} characters).`,
      { hint: "Copy the full key, including any prefix." },
    );
  }
  const lowered = trimmed.toLowerCase();
  if (PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker))) {
    return credentialFault(
      "invalid-key",
      "The value looks like a placeholder rather than a real api key.",
      { hint: "Replace the placeholder with the actual key." },
    );
  }
  return undefined;
}

/**
 * Validate an account name.
 */
export function validateAccountName(name: string): CredentialFault | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return credentialFault("invalid-account", "The account name is empty.", {
      hint: "Use letters, digits, dashes, or underscores.",
    });
  }
  if (trimmed.length > MAX_ACCOUNT_LENGTH) {
    return credentialFault(
      "invalid-account",
      `The account name is too long (max ${MAX_ACCOUNT_LENGTH} characters).`,
    );
  }
  if (!ACCOUNT_PATTERN.test(trimmed)) {
    return credentialFault(
      "invalid-account",
      "The account name contains unsupported characters.",
      { hint: "Use letters, digits, dashes, or underscores only." },
    );
  }
  return undefined;
}

const DEFAULT_ACCOUNT = "default";

function asVerb(token: string | undefined): CredentialVerb | undefined {
  if (token === "signin") return "signin";
  if (token === "signout") return "signout";
  return undefined;
}

export interface CredentialResult {
  readonly handled: boolean;
  readonly verb?: CredentialVerb;
  readonly provider?: string;
  readonly fault?: CredentialFault;
}

interface SigninTarget {
  id: string;
  label: string;
  oauthCapable: boolean;
  apiKeyEntry?: ProviderEntry;
}

function makeSigninTarget(id: string): SigninTarget | undefined {
  const apiKeyEntry = findProvider(id);
  const oauthCapable = isOAuthCapable(id);
  if (apiKeyEntry === undefined && !oauthCapable) return undefined;
  const merged = listLoginProviders().find((p) => p.id === id);
  return {
    id,
    label: apiKeyEntry?.label ?? merged?.label ?? id,
    oauthCapable,
    ...(apiKeyEntry !== undefined ? { apiKeyEntry } : {}),
  };
}

async function resolveSigninTarget(
  named: string | undefined,
  io: CredentialIo,
): Promise<SigninTarget | undefined> {
  if (named !== undefined) {
    const target = makeSigninTarget(named.trim().toLowerCase());
    if (target === undefined) {
      throw credentialFault("unknown-provider", `Unknown provider: ${named}.`, {
        hint: "Run the command with no provider to list the choices.",
      });
    }
    return target;
  }
  const directory = listLoginProviders();
  io.print("Available providers:");
  directory.forEach((entry, index) => {
    const kind = entry.authKind === "oauth" ? "browser sign-in" : "api key";
    io.print(`  ${index + 1}. ${entry.label} (${kind})`);
  });
  const answer = await io.ask("Select a provider by number: ");
  if (answer.length === 0) return undefined;
  const index = Number.parseInt(answer, 10) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= directory.length) {
    throw credentialFault(
      "unknown-provider",
      `That is not one of the listed providers.`,
    );
  }
  const picked = directory[index];
  return makeSigninTarget(picked.id);
}

async function resolveProvider(
  named: string | undefined,
  io: CredentialIo,
): Promise<ProviderEntry | undefined> {
  if (named !== undefined) {
    const entry = findProvider(named);
    if (entry === undefined) {
      throw credentialFault(
        "unknown-provider",
        `Unknown provider: ${named}.`,
        { hint: "Run the command with no provider to list the choices." },
      );
    }
    return entry;
  }
  io.print("Available providers:");
  PROVIDER_DIRECTORY.forEach((entry, index) => {
    io.print(`  ${index + 1}. ${entry.label} (${entry.envKey})`);
  });
  const answer = await io.ask("Select a provider by number: ");
  if (answer.length === 0) return undefined;
  const index = Number.parseInt(answer, 10) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= PROVIDER_DIRECTORY.length) {
    throw credentialFault(
      "unknown-provider",
      `That is not one of the listed providers.`,
    );
  }
  return PROVIDER_DIRECTORY[index];
}

interface VerbFlags {
  provider?: string;
  account?: string;
  method?: SigninMethod;
  list: boolean;
}

function readVerbFlags(rest: readonly string[]): VerbFlags {
  let provider: string | undefined;
  let account: string | undefined;
  let method: SigninMethod | undefined;
  let list = false;
  const positionals: string[] = [];
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token === "--provider" && i + 1 < rest.length) {
      provider = rest[++i];
    } else if (token === "--account" && i + 1 < rest.length) {
      account = rest[++i];
    } else if (token === "--method" && i + 1 < rest.length) {
      method = asSigninMethod(rest[++i]);
    } else if (token === "--oauth") {
      method = "oauth";
    } else if (token === "--api-key" || token === "--apikey") {
      method = "api-key";
    } else if (token === "--list" || token === "--ls") {
      list = true;
    } else if (!token.startsWith("-")) {
      positionals.push(token);
    }
  }
  if (provider === undefined && positionals.length > 0) provider = positionals[0];
  return {
    ...(provider !== undefined ? { provider } : {}),
    ...(account !== undefined ? { account } : {}),
    ...(method !== undefined ? { method } : {}),
    list,
  };
}

async function doListAccounts(
  vault: CredentialCommandOptions["vault"],
  io: CredentialIo,
): Promise<void> {
  const seen = new Set<string>();
  const providers: { id: string; label: string }[] = [];
  for (const entry of listLoginProviders()) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    providers.push({ id: entry.id, label: entry.label });
  }
  io.print("Saved accounts:");
  let any = false;
  for (const { id, label } of providers) {
    const accounts = await vault.listAccounts(id);
    if (accounts.length === 0) continue;
    any = true;
    const fallbackDefault = await vault.defaultAccount(id);
    io.print(`  ${label} (${id}):`);
    for (const account of accounts) {
      const kind = await vault.authKind(id, account);
      const marker = account === fallbackDefault ? " (default)" : "";
      const kindLabel = kind === "oauth" ? "browser" : kind === "apiKey" ? "api key" : "unknown";
      io.print(`    - ${account}${marker} [${kindLabel}]`);
    }
  }
  if (!any) {
    io.print("  (none)");
  }
}

async function doSignin(
  target: SigninTarget,
  requestedAccount: string | undefined,
  method: SigninMethod | undefined,
  vault: CredentialCommandOptions["vault"],
  io: CredentialIo,
): Promise<CredentialFault | undefined> {
  const account = requestedAccount ?? DEFAULT_ACCOUNT;
  const accountFault = validateAccountName(account);
  if (accountFault !== undefined) return accountFault;
  const existing = await vault.listAccounts(target.id);
  if (existing.includes(account)) {
    return credentialFault(
      "name-collision",
      `An account named "${account}" already exists for ${target.label}.`,
      { hint: "Pass --account with a different name, or sign out first." },
    );
  }
  const useOAuth =
    method === "oauth" || (method === undefined && target.oauthCapable);
  if (useOAuth) {
    if (!target.oauthCapable) {
      return credentialFault(
        "unknown-provider",
        `${target.label} does not support browser sign-in.`,
        { hint: "Re-run with --method api-key to store an api key instead." },
      );
    }
    return doOAuthSignin(target, account, vault, io);
  }
  if (target.apiKeyEntry === undefined) {
    return credentialFault(
      "unknown-provider",
      `${target.label} has no api-key sign-in; use browser sign-in instead.`,
      { hint: "Re-run with --method oauth." },
    );
  }
  return doApiKeySignin(target.apiKeyEntry, account, existing.length === 0, vault, io);
}

async function doApiKeySignin(
  provider: ProviderEntry,
  account: string,
  makeDefault: boolean,
  vault: CredentialCommandOptions["vault"],
  io: CredentialIo,
): Promise<CredentialFault | undefined> {
  let apiKey = getEnvApiKey(String(provider.id))?.trim() ?? "";
  if (apiKey.length > 0) {
    io.print(
      `Found ${provider.envKey} in the environment for ${provider.label}.`,
    );
    const useEnv = await io.ask("Store the environment key? [Y/n] ");
    if (/^n/i.test(useEnv)) apiKey = "";
  }
  if (apiKey.length === 0) {
    io.print(`Obtain a key at ${provider.docsUrl}`);
    apiKey = await io.askSecret(`Enter the ${provider.label} api key: `);
  }
  const keyFault = validateApiKey(apiKey);
  if (keyFault !== undefined) return keyFault;
  await vault.putApiKey(String(provider.id), account, apiKey.trim(), makeDefault);
  io.print(
    `Stored ${provider.label} key under account "${account}"${makeDefault ? " (default)" : ""}.`,
  );
  return undefined;
}

async function doOAuthSignin(
  target: SigninTarget,
  account: string,
  vault: CredentialCommandOptions["vault"],
  io: CredentialIo,
): Promise<CredentialFault | undefined> {
  io.print(`Starting browser sign-in for ${target.label}...`);
  try {
    const result = await startOAuthLogin(
      target.id,
      {
        onAuth: (info): void => {
          void openLoginUrl(info.url).then((opened) => {
            io.print(`${opened ? "Opened" : "Open this url"}: ${info.url}`);
            if (info.instructions !== undefined) io.print(info.instructions);
          });
        },
        onPrompt: (prompt): Promise<string> => io.ask(`${prompt.message} `),
        onProgress: (message): void => io.print(message),
      },
      vault,
      account,
    );
    io.print(
      `Signed in to ${target.label} under account "${result.account}"${result.madeDefault ? " (default)" : ""}.`,
    );
    return undefined;
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "The browser sign-in failed.";
    return credentialFault("vault", `Browser sign-in failed: ${message}`, {
      hint: "Try again, or use --method api-key to store an api key instead.",
      cause,
    });
  }
}

async function doSignout(
  provider: ProviderEntry,
  requestedAccount: string | undefined,
  vault: CredentialCommandOptions["vault"],
  io: CredentialIo,
): Promise<CredentialFault | undefined> {
  if (requestedAccount !== undefined) {
    const accountFault = validateAccountName(requestedAccount);
    if (accountFault !== undefined) return accountFault;
  }
  const removed = await vault.remove(String(provider.id), requestedAccount);
  if (!removed) {
    const scope =
      requestedAccount !== undefined ? `account "${requestedAccount}"` : "any account";
    return credentialFault(
      "not-found",
      `No stored credential for ${provider.label} (${scope}).`,
    );
  }
  io.print(
    requestedAccount !== undefined
      ? `Removed ${provider.label} account "${requestedAccount}".`
      : `Removed all ${provider.label} credentials.`,
  );
  return undefined;
}

function toVaultFault(cause: unknown): CredentialFault {
  const message =
    cause instanceof Error ? cause.message : "The credential store failed.";
  return credentialFault("vault", message, { cause });
}

/**
 * Run the api-key sign-in / sign-out command.
 */
export async function runCredentialCommand(
  argv: readonly string[],
  opts: CredentialCommandOptions & { io?: CredentialIo },
): Promise<CredentialResult> {
  const verb = asVerb(argv[0]);
  if (verb === undefined) return { handled: false };
  const io = opts.io ?? defaultCredentialIo();
  const rest = argv.slice(1);
  const { provider: namedProvider, account, method, list } = readVerbFlags(rest);
  if (verb === "signin" && list) {
    try {
      await doListAccounts(opts.vault, io);
      return { handled: true, verb };
    } catch (cause) {
      return { handled: true, verb, fault: toVaultFault(cause) };
    }
  }
  try {
    if (verb === "signin") {
      const resolved = await resolveSigninTarget(namedProvider, io);
      if (resolved === undefined) {
        return {
          handled: true,
          verb,
          fault: credentialFault("aborted", "No provider was selected."),
        };
      }
      const fault = await doSignin(resolved, account, method, opts.vault, io);
      return fault === undefined
        ? { handled: true, verb, provider: resolved.id }
        : { handled: true, verb, provider: resolved.id, fault };
    }
    const provider = await resolveProvider(namedProvider, io);
    if (provider === undefined) {
      return {
        handled: true,
        verb,
        fault: credentialFault("aborted", "No provider was selected."),
      };
    }
    const fault = await doSignout(provider, account, opts.vault, io);
    return fault === undefined
      ? { handled: true, verb, provider: String(provider.id) }
      : { handled: true, verb, provider: String(provider.id), fault };
  } catch (cause) {
    return {
      handled: true,
      verb,
      fault: toVaultFault(cause),
    };
  }
}

/**
 * Render a {@link CredentialFault} as the single human-facing message.
 */
export function formatCredentialFault(fault: CredentialFault): string {
  const head = `${faultLabel(fault.kind)}: ${fault.message}`;
  return fault.hint !== undefined ? `${head}\n  ${fault.hint}` : head;
}

function faultLabel(kind: CredentialFault["kind"]): string {
  switch (kind) {
    case "unknown-provider":
      return "Unknown provider";
    case "invalid-key":
      return "Invalid api key";
    case "invalid-account":
      return "Invalid account name";
    case "name-collision":
      return "Account already exists";
    case "not-found":
      return "Nothing to remove";
    case "vault":
      return "Credential store error";
    case "aborted":
      return "Cancelled";
  }
}