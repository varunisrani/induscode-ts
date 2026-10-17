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
import {
  ensureFreshOAuthCredentials,
  getOAuthProvider,
} from "indusagi/ai";
import type { AuthVault } from "../launch.js";
import { atomicWritePrivateFileSync, readPrivateFileSync } from "../security/private-state.js";

interface OAuthRecord {
  access: string;
  refresh: string;
  expires?: number;
  [key: string]: unknown;
}

interface ApiKeyRecord {
  kind: "apiKey";
  key: string;
  isDefault: boolean;
}

interface OAuthStoredRecord extends OAuthRecord {
  kind: "oauth";
  isDefault: boolean;
}

type NormalisedRecord = ApiKeyRecord | OAuthStoredRecord;

function normaliseRecord(value: unknown): NormalisedRecord | undefined {
  if (value === null || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const isDefault = raw.isDefault === true;
  if (raw.kind === "oauth") {
    if (typeof raw.access === "string" && typeof raw.refresh === "string") {
      return { ...raw, kind: "oauth", isDefault } as OAuthStoredRecord;
    }
    return undefined;
  }
  if (raw.kind === "apiKey" && typeof raw.key === "string") {
    return { kind: "apiKey", key: raw.key, isDefault };
  }
  if (typeof raw.apiKey === "string") {
    return { kind: "apiKey", key: raw.apiKey, isDefault };
  }
  return undefined;
}

function readAuthFile(filePath: string): Record<string, Record<string, NormalisedRecord>> {
  const text = readPrivateFileSync(filePath);
  if (text === null) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object") return {};
    const file: Record<string, Record<string, NormalisedRecord>> = {};
    for (const [provider, accounts] of Object.entries(parsed)) {
      if (accounts === null || typeof accounts !== "object") continue;
      const normalised: Record<string, NormalisedRecord> = {};
      for (const [account, record] of Object.entries(accounts)) {
        const value = normaliseRecord(record);
        if (value !== undefined) normalised[account] = value;
      }
      file[provider] = normalised;
    }
    return file;
  } catch {
    return {};
  }
}

function writeAuthFile(
  filePath: string,
  data: Record<string, Record<string, NormalisedRecord>>,
): void {
  atomicWritePrivateFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function toCredentials(record: OAuthStoredRecord): OAuthRecord {
  const { kind: _kind, isDefault: _isDefault, ...credentials } = record;
  return credentials as OAuthRecord;
}

function clearDefaults(accounts: Record<string, NormalisedRecord>): void {
  for (const name of Object.keys(accounts)) {
    accounts[name] = { ...accounts[name], isDefault: false };
  }
}

/**
 * Build a disk-backed {@link AuthVault} persisting to `authPath`.
 *
 * @param authPath absolute path of the JSON credential store (e.g. `auth.json`)
 */
export function createAuthVault(authPath: string): AuthVault {
  return {
    async listAccounts(provider) {
      const file = readAuthFile(authPath);
      return Object.keys(file[provider] ?? {});
    },
    async defaultAccount(provider) {
      const file = readAuthFile(authPath);
      const accounts = file[provider] ?? {};
      for (const [account, record] of Object.entries(accounts)) {
        if (record.isDefault) return account;
      }
      return undefined;
    },
    async putApiKey(provider, account, apiKey, makeDefault = false) {
      const file = readAuthFile(authPath);
      const accounts: Record<string, NormalisedRecord> = { ...(file[provider] ?? {}) };
      if (makeDefault) clearDefaults(accounts);
      accounts[account] = { kind: "apiKey", key: apiKey, isDefault: makeDefault };
      file[provider] = accounts;
      writeAuthFile(authPath, file);
    },
    async putOAuth(provider, account, credentials, makeDefault = false) {
      const file = readAuthFile(authPath);
      const accounts: Record<string, NormalisedRecord> = { ...(file[provider] ?? {}) };
      if (makeDefault) clearDefaults(accounts);
      accounts[account] = { ...credentials, kind: "oauth", isDefault: makeDefault };
      file[provider] = accounts;
      writeAuthFile(authPath, file);
    },
    async authKind(provider, account) {
      const file = readAuthFile(authPath);
      return file[provider]?.[account]?.kind;
    },
    async readUsableKey(provider, account) {
      const file = readAuthFile(authPath);
      const record = file[provider]?.[account];
      if (record === undefined) return undefined;
      if (record.kind === "apiKey") return record.key;
      const handler = getOAuthProvider(provider);
      if (handler === undefined) return undefined;
      const current = toCredentials(record);
      const result = await ensureFreshOAuthCredentials(provider, current);
      if (result.refreshed) {
        const accounts: Record<string, NormalisedRecord> = { ...(file[provider] ?? {}) };
        accounts[account] = {
          ...result.credentials,
          kind: "oauth",
          isDefault: record.isDefault,
        };
        file[provider] = accounts;
        writeAuthFile(authPath, file);
      }
      return handler.getApiKey(result.credentials);
    },
    async remove(provider, account) {
      const file = readAuthFile(authPath);
      const accounts = file[provider];
      if (accounts === undefined) return false;
      if (account === undefined) {
        delete file[provider];
        writeAuthFile(authPath, file);
        return true;
      }
      if (accounts[account] === undefined) return false;
      const wasDefault = accounts[account].isDefault;
      delete accounts[account];
      const survivors = Object.keys(accounts);
      if (wasDefault && survivors.length > 0) {
        accounts[survivors[0]] = { ...accounts[survivors[0]], isDefault: true };
      }
      if (survivors.length === 0) {
        delete file[provider];
      } else {
        file[provider] = accounts;
      }
      writeAuthFile(authPath, file);
      return true;
    },
  };
}
