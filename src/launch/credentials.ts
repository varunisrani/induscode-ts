// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Credential command — `runCredentialCommand`.
 *
 * The top-level `signin` / `signout` surface. Sign-in supports two methods: a
 * browser sign-in (OAuth) for the providers the framework registry exposes, and
 * an api-key flow for every provider in the directory. When a provider is
 * sign-in-capable the command prefers the browser flow but still lets the user
 * pick an api key; for the rest it stores a key directly. The env-var override is
 * consulted first via the framework {@link getEnvApiKey}, so a user who already
 * exported (e.g.) `ANTHROPIC_API_KEY` can sign in without re-typing the secret.
 *
 * The command owns the first positional token only: it returns `handled: false`
 * when that token is neither {@link CredentialVerb} so the caller falls through
 * to a normal launch. Every failure is a typed {@link CredentialFault}; nothing
 * is signalled by a string sentinel or a bare `process.exit`.
 *
 * I/O is injected. The default {@link CredentialIo} wraps `process.stdout` plus a
 * `node:readline/promises` interface, but tests drive the whole flow over an
 * in-memory stand-in with no real terminal and an in-memory vault.
 */
import { type CredentialCommandOptions, type CredentialFault, type CredentialVerb, type ProviderEntry } from "./contract";
/**
 * The console seam the credential command reads and writes through.
 *
 * Pinned to the three operations the flow actually needs — emit a line, read a
 * line of input, and read a secret line — so a test can capture output into an
 * array and feed scripted answers without a real TTY.
 */
export interface CredentialIo {
    /** Emit one line of human-facing text. */
    print(line: string): void;
    /** Prompt for and read one line of visible input. */
    ask(prompt: string): Promise<string>;
    /** Prompt for and read one line of secret input (key entry). */
    askSecret(prompt: string): Promise<string>;
}
/**
 * The default {@link CredentialIo} backed by `process.stdout` and a
 * `node:readline/promises` interface. Secret entry mutes echo while the line is
 * typed by suppressing the terminal write of each keystroke.
 */
export declare function defaultCredentialIo(): CredentialIo;
/**
 * The api-key provider directory: every provider the sign-in surface can store a
 * key for, with its conventional env var and the page a user obtains a key from.
 * These are external provider facts; {@link envKey} is the variable
 * {@link getEnvApiKey} reads for the env-first shortcut.
 */
export declare const PROVIDER_DIRECTORY: readonly ProviderEntry[];
/** Look up a provider entry by id (case-insensitive over the directory). */
export declare function findProvider(id: string): ProviderEntry | undefined;
/**
 * The two ways a provider can be signed in to.
 *
 *   - `oauth`   — a browser sign-in driven by the framework registry.
 *   - `api-key` — paste / store a provider api key.
 */
export type SigninMethod = "oauth" | "api-key";
/** Narrow a `--method` value to a {@link SigninMethod}. */
export declare function asSigninMethod(value: string | undefined): SigninMethod | undefined;
/** Whether a provider id can be signed in to through the browser registry. */
export declare function isOAuthCapable(id: string): boolean;
/**
 * Validate an api key against the format rules: non-empty, at least
 * {@link MIN_KEY_LENGTH} characters, and free of placeholder markers. Returns a
 * typed {@link CredentialFault} on rejection, or `undefined` when the key passes.
 */
export declare function validateApiKey(key: string): CredentialFault | undefined;
/**
 * Validate an account name: at most {@link MAX_ACCOUNT_LENGTH} characters and
 * matching {@link ACCOUNT_PATTERN}. Returns a typed fault on rejection, or
 * `undefined` when the name is acceptable.
 */
export declare function validateAccountName(name: string): CredentialFault | undefined;
/**
 * The outcome of {@link runCredentialCommand}.
 *
 * {@link handled} reports whether the first positional token was a recognised
 * {@link CredentialVerb}; when `false`, the caller proceeds to a normal launch
 * unchanged. {@link fault} carries a typed failure when the command was handled
 * but did not complete.
 */
export interface CredentialResult {
    /** Whether this invocation was a `signin` / `signout` command. */
    readonly handled: boolean;
    /** The verb that ran, when {@link handled} is true. */
    readonly verb?: CredentialVerb;
    /** The provider id the verb acted on, when one was resolved. */
    readonly provider?: string;
    /** A typed failure, present only when the handled command did not complete. */
    readonly fault?: CredentialFault;
}
/**
 * Run the api-key sign-in / sign-out command.
 *
 * Returns `{ handled: false }` immediately when `argv[0]` is neither verb, so the
 * orchestrator can call this first and fall through on a miss. Otherwise it
 * resolves the provider (prompting from the directory when none is named), runs
 * the verb, and resolves a {@link CredentialResult} — never throwing for an
 * expected failure, which surfaces as {@link CredentialResult.fault}.
 *
 * @param argv the raw token list following the program name
 * @param opts the injected vault, profile directory, and (optionally) the io seam
 */
export declare function runCredentialCommand(argv: readonly string[], opts: CredentialCommandOptions & {
    io?: CredentialIo;
}): Promise<CredentialResult>;
/**
 * Render a {@link CredentialFault} as the single human-facing message the caller
 * prints before exiting non-zero. Pure; no I/O.
 */
export declare function formatCredentialFault(fault: CredentialFault): string;
