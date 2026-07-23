// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Package command — `runPackageCommand`.
 *
 * The top-level `install` / `remove` / `update` / `list` / `config` surface that
 * manages the extension-package sources the launcher loads. A source is a plain
 * string the loader understands — an `npm:` spec, a `git:` / `https:` repo, or a
 * bare local path — and the configured set lives in the user settings under the
 * `extensionPackages` key, persisted through the {@link PreferenceStore}.
 *
 * The command owns the first positional token only: it returns
 * `{ handled: false }` when that token is not one of the recognised subcommands,
 * so the orchestrator can call this first and fall through to a normal launch on
 * a miss. It never throws for an expected failure — a bad argument is reported as
 * a printed line and a non-zero {@link PackageResult.code}.
 *
 * I/O is injected. The default {@link PackageIo} wraps `process.stdout` /
 * `process.stderr`, but tests drive the whole flow over an in-memory stand-in and
 * a store pinned to a temp directory, so the real home is never touched.
 */
import { PreferenceStore } from "../settings";
/** The five subcommands the package command recognises as the first token. */
export type PackageCommand = "install" | "remove" | "update" | "list" | "config";
/** Every {@link PackageCommand}, as a frozen tuple for membership tests. */
export declare const PACKAGE_COMMANDS: readonly PackageCommand[];
/**
 * The console seam the package command writes through. Pinned to a normal line
 * and an error line so a test can capture both streams without a real terminal.
 */
export interface PackageIo {
    /** Emit one line of human-facing text to the standard stream. */
    print(line: string): void;
    /** Emit one line to the error stream. */
    printError(line: string): void;
}
/** The default {@link PackageIo} backed by `process.stdout` / `process.stderr`. */
export declare function defaultPackageIo(): PackageIo;
/**
 * Options for {@link runPackageCommand}: the injected settings store the sources
 * persist through and the optional io seam. The store is injected so tests pin it
 * to a temp directory; boot resolves it from the workspace.
 */
export interface PackageCommandOptions {
    /** The settings store the package sources read from and write to. */
    readonly store: PreferenceStore;
    /** The console seam; defaults to {@link defaultPackageIo}. */
    readonly io?: PackageIo;
}
/**
 * The outcome of {@link runPackageCommand}.
 *
 * {@link handled} reports whether the first token was a recognised subcommand;
 * when `false`, the caller proceeds to a normal launch unchanged. {@link code}
 * is the process exit code for a handled command — zero on success, non-zero when
 * a required argument was missing or invalid.
 */
export interface PackageResult {
    /** Whether this invocation was a package subcommand. */
    readonly handled: boolean;
    /** The subcommand that ran, when {@link handled} is true. */
    readonly command?: PackageCommand;
    /** Process exit code for a handled command (zero on success). */
    readonly code?: number;
}
/**
 * Run the package command.
 *
 * Returns `{ handled: false }` immediately when `argv[0]` is not a recognised
 * subcommand, so the orchestrator can call this first and fall through on a miss.
 * Otherwise it performs the subcommand against the injected store and resolves a
 * {@link PackageResult} — never throwing for an expected failure.
 *
 * @param argv the raw token list following the program name
 * @param opts the injected settings store and (optionally) the io seam
 */
export declare function runPackageCommand(argv: readonly string[], opts: PackageCommandOptions): Promise<PackageResult>;
