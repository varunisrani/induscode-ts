// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Settings manager — the two-tier reader/writer over the preference record.
 *
 * Two files back the same {@link Preferences} shape:
 *
 *   - the **global** file, one per machine, living in the resolved workspace
 *     profile directory ({@link Workspace.settingsPath});
 *   - the **project** file, one per checkout, living beside the working tree in
 *     a brand-named config directory.
 *
 * A read layers the project tier over the global tier over
 * {@link DEFAULT_PREFERENCES}: a key set in the project file wins, then the
 * global file, then the built-in default — so a reader of {@link PreferenceStore.get}
 * always receives a concrete value. A write through {@link PreferenceStore.set}
 * lands in the **project** tier only; the global file is left untouched, which
 * keeps a per-checkout override from silently leaking machine-wide.
 *
 * Loading is tolerant: a missing file is the empty record, and a corrupt file
 * (bad JSON, or a JSON value that is not an object) degrades to the empty record
 * rather than throwing, so one mangled file never blocks startup.
 *
 * Construction is injectable. {@link PreferenceStore.fromWorkspace} resolves the
 * two paths from a {@link Workspace} and the working directory; {@link PreferenceStore.atPaths}
 * pins both paths directly, which is what the tests drive against a temp dir so
 * the real home is never read or written.
 */
import type { Workspace } from "../boot/contract";
import { type Preferences, type SettingKey } from "./contract";
/**
 * The resolved location of the two preference tiers.
 *
 * Both are absolute paths. The {@link global} file is machine-wide; the
 * {@link project} file is per-checkout. Either may be absent on disk — the
 * store treats a missing file as the empty record.
 */
export interface PreferenceLocations {
    /** Machine-wide preference file (the global tier). */
    readonly global: string;
    /** Per-checkout preference file (the project tier). */
    readonly project: string;
}
/**
 * Two-tier preference store: project-over-global-over-default on read, and a
 * project-tier write on save.
 *
 * Construct via {@link fromWorkspace} (resolve from the workspace + cwd) or
 * {@link atPaths} (pin both files explicitly, as the tests do). Internally the
 * two tiers are held in memory and refreshed from disk on construction and on
 * {@link reload}; {@link set} stages a change into the in-memory project tier
 * and {@link save} flushes it.
 */
export declare class PreferenceStore {
    private readonly locations;
    private globalTier;
    private projectTier;
    private constructor();
    /**
     * Build a store whose two tiers are pinned to explicit absolute paths.
     *
     * The direct seam used by tests: point both files at a temp dir and the real
     * home is never touched. Neither file needs to exist yet.
     */
    static atPaths(locations: PreferenceLocations): PreferenceStore;
    /**
     * Build a store from a resolved {@link Workspace} (global tier) and a working
     * directory (project tier).
     *
     * The global file is {@link Workspace.settingsPath}; the project file is
     * `<cwd>/<brand profile dir>/settings.json`, so a checkout carries its own
     * overrides next to its source. `cwd` defaults to the process working
     * directory.
     */
    static fromWorkspace(workspace: Workspace, cwd?: string): PreferenceStore;
    /** The two resolved file locations this store reads and writes. */
    paths(): PreferenceLocations;
    /** Re-read both tiers from disk, discarding any unsaved staged change. */
    reload(): void;
    /**
     * Read one preference, resolved across the tiers.
     *
     * Precedence is project → global → {@link DEFAULT_PREFERENCES}: the first tier
     * that defines the key (with a non-`undefined` value) wins. The return type is
     * the concrete default-backed type for the key, so callers never branch on
     * `undefined`.
     */
    get<K extends SettingKey>(key: K): Required<Preferences>[K];
    /**
     * Stage a preference into the in-memory **project** tier.
     *
     * Does not write to disk on its own — call {@link save} to persist. Setting a
     * key to `undefined` clears the project-tier override for it, letting the
     * value fall back to the global tier or the default on the next read.
     */
    set<K extends SettingKey>(key: K, value: Preferences[K]): void;
    /** The fully-resolved snapshot: defaults under global under project. */
    snapshot(): Required<Preferences>;
    /** The raw in-memory project tier (the keys a checkout overrides). */
    projectOverrides(): Preferences;
    /** The raw in-memory global tier (machine-wide keys). */
    globalDefaults(): Preferences;
    /**
     * Persist the staged in-memory **project** tier to its file.
     *
     * Writes the project tier only; the global file is never rewritten here, so a
     * per-checkout `set` cannot mutate machine-wide preferences. Creates the
     * containing directory if it is missing.
     */
    save(): void;
}
