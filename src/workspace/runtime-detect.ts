// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Runtime / package-root detection.
 *
 * Two facts the rest of boot needs to know about *how* the process was started:
 *
 *   1. Is this a single-file compiled binary (a Bun standalone executable) or
 *      an ordinary interpreted launch (Node, or `bun run` over source)?
 *   2. Where on disk is the package root — the directory that anchors bundled
 *      assets (themes, export templates) and the `package.json` manifest?
 *
 * The compiled-binary case is *dictated by the Bun toolchain*: a standalone
 * executable resolves its own module URLs through a synthetic virtual
 * filesystem whose path component Bun spells `$bunfs` (and, depending on the
 * platform/escaping, the home-marker variants `~BUN` / `%7EBUN`). Those exact
 * markers are not a stylistic choice — they are the only signal Bun emits — so
 * we keep the literals but quarantine them inside a *single* renamed probe
 * ({@link detectPackagingFromModuleUrl}) instead of scattering the check.
 *
 * Root resolution is expressed as an ordered {@link resolveRoot} strategy table:
 * the first strategy that matches the detected packaging produces the root, so
 * adding a future strategy (e.g. an explicit override) is a row, not a branch.
 */
/**
 * The two shapes a launch can take, from the boot layer's point of view.
 *
 *   - `compiled-binary` — a Bun standalone executable; assets live next to
 *     {@link process.execPath}, and module URLs point at Bun's virtual FS.
 *   - `interpreted` — Node, or `bun run` over a real source/`dist` tree; assets
 *     live in the directory tree containing this module.
 */
export type Packaging = "compiled-binary" | "interpreted";
/**
 * The lone probe over an `import.meta.url`-shaped string.
 *
 * Renamed wrapper around the (Bun-dictated) virtual-FS markers: if the module
 * URL carries any marker the launch is a compiled binary, otherwise it is an
 * interpreted run. Pure and string-only so it is trivially unit-testable
 * without spawning a real binary.
 *
 * @param moduleUrl the `import.meta.url` of the calling module.
 */
export declare function detectPackagingFromModuleUrl(moduleUrl: string): Packaging;
/**
 * Whether the current process is a Bun-compiled standalone binary.
 *
 * Convenience over {@link detectPackagingFromModuleUrl} bound to this module's
 * own URL — the single public predicate the rest of boot calls.
 */
export declare function isPackagedBinary(): boolean;
/**
 * Resolve the absolute package-root directory for the active launch.
 *
 * Detects packaging once, then folds the {@link ROOT_STRATEGIES} table to the
 * first claimant. The final row claims unconditionally, so this always returns.
 */
export declare function resolvePackageRoot(): string;
