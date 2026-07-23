// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Addon sandbox — the SINGLE jiti-backed {@link ModuleLoader}.
 *
 * This module turns a path on disk into a loaded {@link AddonManifest}. It is the
 * one place the app reaches a TypeScript-on-the-fly importer (`jiti`), and it is
 * the one place the framework namespaces an addon may `import` are bridged into
 * the addon's module graph. Two facts shape the design:
 *
 *   1. **A compiled binary has no `node_modules`.** When the app ships as a
 *      single-file executable the framework code (`indusagi/agent`, `indusagi/ai`,
 *      `indusagi/tui`) and `@sinclair/typebox` are already *inside* the binary —
 *      an addon's `import "indusagi/agent"` cannot resolve against a directory
 *      that does not exist on the host. The sandbox satisfies those specifiers
 *      from the host's own statically-imported namespace objects (jiti's
 *      `virtualModules`), so the addon shares the host's exact module instances
 *      rather than loading a second copy.
 *
 *   2. **An interpreted launch has real files.** Under Node (or `bun run` over
 *      source) the same specifiers resolve to real paths on disk; the sandbox
 *      feeds those resolved paths to jiti as `alias` entries so the importer
 *      finds them without re-walking `node_modules`.
 *
 * The literal set of bridged specifiers is the contract's {@link BUNDLED_NAMESPACES};
 * this module owns only the *mechanism* that maps each one to either a live
 * namespace object (virtual-module mode) or a resolved file path (alias mode).
 *
 * The loader is deliberately injectable: {@link createJitiLoader} is the default
 * {@link ModuleLoader}, but every consumer takes the interface, so a test can
 * inject a scripted fake that returns a manifest with no jiti and no disk.
 *
 * Path inputs are normalized through this module's own {@link expandPath} /
 * {@link resolvePath} helpers — home-directory expansion plus a from-scratch
 * invisible-whitespace scrub — written here rather than imported, so the loader
 * owns its full input-hygiene story.
 */
import { type ModuleLoader } from "./contract";
/**
 * Strip invisible / non-standard whitespace from a path string and trim ordinary
 * leading and trailing ASCII whitespace.
 *
 * Walks the string by code point (so astral characters survive intact), dropping
 * any member of {@link INVISIBLE_SET}, then trims the plain ASCII edges. Written
 * as an explicit scan rather than a regex so the exact handled set is visible at
 * the call site.
 *
 * @param raw the path as supplied (possibly carrying invisible characters)
 */
export declare function scrubInvisible(raw: string): string;
/**
 * Expand a leading `~` (or `~/`) to the user's home directory.
 *
 * Only a `~` that begins the (already-scrubbed) string is treated as the home
 * marker; a `~` anywhere else is an ordinary character. `~` alone becomes the
 * home directory; `~/x` becomes `<home>/x`. A `home` override is accepted for
 * tests and embedding so the function never reads the environment implicitly.
 *
 * @param raw  the path, possibly beginning with a home marker
 * @param home the home directory to expand against; defaults to {@link homedir}
 */
export declare function expandPath(raw: string, home?: string): string;
/**
 * Resolve a path to an absolute, invisible-free path.
 *
 * Scrubs invisible whitespace, expands a leading home marker, then anchors the
 * result against `base` (the working directory) when it is not already absolute.
 * The single normalizer every loader entry funnels through, so input hygiene is
 * applied in exactly one place.
 *
 * @param raw  the path as supplied
 * @param base the directory a relative path resolves against; defaults to `process.cwd()`
 * @param home the home directory `~` expands against; defaults to {@link homedir}
 */
export declare function resolvePath(raw: string, base?: string, home?: string): string;
/**
 * Options for {@link createJitiLoader}.
 *
 * All optional — the defaults wire the live runtime — but each is overridable so
 * a test can pin the working directory or home without touching the process. The
 * jiti instance itself is constructed from {@link jitiOptionsForRuntime}; these
 * options only steer how a supplied path is normalized before it is imported.
 */
export interface JitiLoaderOptions {
    /** Directory a relative addon path resolves against; defaults to `process.cwd()`. */
    readonly base?: string;
    /** Home directory a leading `~` expands against; defaults to {@link homedir}. */
    readonly home?: string;
}
/**
 * Construct the default jiti-backed {@link ModuleLoader}.
 *
 * Creates one jiti instance — configured with the bridged framework namespaces
 * appropriate to the runtime (virtual modules in a compiled binary, resolved
 * aliases under Node) — and returns a loader whose {@link ModuleLoader.load}
 * normalizes the supplied path, imports it through jiti, and extracts the
 * {@link AddonManifest}. A module that does not expose a callable `register` is
 * rejected, so the host converts the rejection into a load fault.
 *
 * This is the production loader; tests inject a fake implementing the same
 * interface, exercising the registry/host without any real jiti or disk.
 *
 * @param options optional path-normalization overrides
 */
export declare function createJitiLoader(options?: JitiLoaderOptions): ModuleLoader;
