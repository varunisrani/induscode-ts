// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Addon discovery — scanning a workspace for addon entry modules.
 *
 * Where {@link module:sandbox} answers "how do I load *this* path", this module
 * answers "*which* paths are there to load". It walks the per-workspace
 * {@link ADDONS_DIR} (`.indus/addons`) one level deep and yields the absolute
 * entry-module paths a {@link ModuleLoader} will resolve. Three candidate shapes
 * are recognised inside that directory:
 *
 *   1. **A bare module file** — `something.ts` / `.js` (and the ESM/TS variants)
 *      sitting directly in the addons directory *is* its own entry.
 *   2. **A package directory with a manifest field** — a subdirectory whose
 *      `package.json` carries an {@link ADDON_MANIFEST_FIELD} (`indusAddon`)
 *      pointing at the entry module relative to that subdirectory.
 *   3. **A package directory with a conventional index** — a subdirectory with no
 *      manifest field falls back to an `index.*` entry if one exists.
 *
 * Discovery is filesystem-only and never imports a module: it produces *paths*,
 * leaving the actual jiti import to the loader. Hidden entries (dot-files and
 * dot-directories) are skipped so editor and VCS detritus is never treated as an
 * addon. The scan is resilient: a missing addons directory yields an empty list
 * rather than an error, and an unreadable package directory is silently skipped.
 *
 * Two entry points are exposed:
 *   - {@link discoverAddons} — the low-level "scan one directory, return paths".
 *   - {@link discoverSources} — folds an {@link AddonDiscovery} config (workspace +
 *     explicit paths) into a deduplicated, id-stamped {@link AddonSource} list the
 *     host feeds to the loader.
 */
import { type AddonDiscovery, type AddonSource } from "./contract";
/**
 * Scan one addons directory and return the absolute entry-module paths it holds.
 *
 * Walks `dir` a single level deep, resolving each non-hidden child through
 * {@link resolveTopLevelEntry}. The result is sorted by path for a stable,
 * deterministic load order, and is empty when `dir` is missing or holds no
 * recognised addon. This is the low-level primitive; {@link discoverSources}
 * layers the config (workspace + explicit paths) and id-stamping on top.
 *
 * @param dir absolute path to an addons directory (typically `<workspace>/.indus/addons`)
 */
export declare function discoverAddons(dir: string): string[];
/**
 * Fold an {@link AddonDiscovery} config into the ordered, deduplicated list of
 * {@link AddonSource}s the host hands to the loader.
 *
 * Concatenates, in this order: the entries discovered under the workspace's
 * addons directory (when a `workspace` is given), then any {@link
 * AddonDiscovery.explicitPaths} (resolved to absolute paths). Duplicate paths are
 * collapsed — the first occurrence wins — and each surviving path is stamped with
 * a derived {@link AddonId}. Discovery touches the filesystem only to enumerate;
 * it never imports a module.
 *
 * @param discovery the discovery configuration (workspace, dir, explicit paths)
 */
export declare function discoverSources(discovery: AddonDiscovery): AddonSource[];
