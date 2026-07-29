/**
 * Settings manager — the two-tier reader/writer over the preference record.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Workspace } from "../boot/contract.js";
import { BRAND } from "../workspace/brand.js";
import { DEFAULT_PREFERENCES, type Preferences, type SettingKey } from "./contract.js";

export interface PreferenceLocations {
  readonly global: string;
  readonly project: string;
}

type PreferencesPartial = Partial<Preferences>;

function loadTier(filePath: string): PreferencesPartial {
  if (!existsSync(filePath)) return {};
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  return { ...(parsed as Record<string, unknown>) } as PreferencesPartial;
}

function writeTier(filePath: string, tier: PreferencesPartial): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(tier, null, 2)}\n`, "utf-8");
}

export class PreferenceStore {
  readonly #locations: PreferenceLocations;
  #globalTier: PreferencesPartial;
  #projectTier: PreferencesPartial;

  private constructor(locations: PreferenceLocations) {
    this.#locations = locations;
    this.#globalTier = loadTier(locations.global);
    this.#projectTier = loadTier(locations.project);
  }

  static atPaths(locations: PreferenceLocations): PreferenceStore {
    return new PreferenceStore(locations);
  }

  static fromWorkspace(workspace: Workspace, cwd: string = process.cwd()): PreferenceStore {
    return new PreferenceStore({
      global: workspace.settingsPath,
      project: join(cwd, BRAND.profileDirName, "settings.json"),
    });
  }

  paths(): PreferenceLocations {
    return { ...this.#locations };
  }

  reload(): void {
    this.#globalTier = loadTier(this.#locations.global);
    this.#projectTier = loadTier(this.#locations.project);
  }

  get<K extends SettingKey>(key: K): Required<Preferences>[K] {
    const fromProject = (this.#projectTier as Record<string, unknown>)[key];
    if (fromProject !== undefined) return fromProject as Required<Preferences>[K];
    const fromGlobal = (this.#globalTier as Record<string, unknown>)[key];
    if (fromGlobal !== undefined) return fromGlobal as Required<Preferences>[K];
    return DEFAULT_PREFERENCES[key];
  }

  set<K extends SettingKey>(key: K, value: Preferences[K]): void {
    if (value === undefined) {
      delete (this.#projectTier as Record<string, unknown>)[key];
      return;
    }
    (this.#projectTier as Record<string, unknown>)[key] = value as unknown;
  }

  snapshot(): Required<Preferences> {
    return {
      ...DEFAULT_PREFERENCES,
      ...stripUndefined(this.#globalTier),
      ...stripUndefined(this.#projectTier),
    } as Required<Preferences>;
  }

  projectOverrides(): Preferences {
    return { ...this.#projectTier };
  }

  globalDefaults(): Preferences {
    return { ...this.#globalTier };
  }

  save(): void {
    writeTier(this.#locations.project, this.#projectTier);
  }
}

function stripUndefined(tier: PreferencesPartial): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tier)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}