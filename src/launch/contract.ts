// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Launch contract — the FROZEN type surface of Phase 10 (command-line surface).
 *
 * This module is the single typed seam between a raw `argv` and a fully
 * configured run. It owns the *application* command line: the declarative flag
 * table, the parsed {@link Invocation} those flags fold into, the gathered
 * `@file` {@link Attachments}, and the typed {@link CredentialFault} the
 * api-key sign-in surface raises. It declares *only* shapes plus a few inert,
 * pure helpers — no parsing, no readline, no I/O, no React. The reader
 * ({@link readInvocation}), the usage renderer ({@link renderUsage}), the
 * attachment gatherer ({@link gatherAttachments}), the model-catalog printer
 * ({@link printModelCatalog}), the resume picker ({@link pickResumeTarget}),
 * the settings browser ({@link browseSettings}), and the credential command
 * ({@link runCredentialCommand}) are each written against the names declared
 * here, so the file is intentionally small, append-mostly, and stable.
 *
 * Design stance:
 *   - There is exactly **one declarative {@link FlagSpec} table** ({@link FLAGS}).
 *     The reader walks it to bind tokens; {@link renderUsage} generates the help
 *     text *from the same table*. Help and parsing cannot drift, because there
 *     is no second hand-maintained help string to drift against.
 *   - {@link Invocation} is a **superset of the boot-layer minimal invocation**:
 *     it keeps `mode` / `prompt` / `flags` / `positionals` and adds the resolved,
 *     strongly-typed launch fields the runtime reads (model, account, system
 *     prompt, thinking effort, the tool/extension/mcp rosters, the output
 *     toggles). Boot routes on the thin shape; the launch layer enriches it.
 *   - Sign-in is **api-key only**. {@link runCredentialCommand} validates and
 *     stores keys per named account through the framework credential vault and
 *     {@link getEnvApiKey}; there is no OAuth verb and no OAuth route. Failures
 *     are a single typed {@link CredentialFault} union, never string sentinels.
 *   - `@file` arguments expand to one {@link Attachments} value: inlined prose
 *     plus base64 media, with the framework path resolver doing the lookup.
 *
 * Framework anchors (all from the `indusagi` package — the sibling rebuilt
 * framework this app targets):
 *   - `ThinkingLevel`, `SessionInfo`, `SessionListProgress`, `resolveReadPath`
 *                                                            ← `indusagi/agent`
 *   - `ImageContent`, `KnownProvider`, `ModelRegistry`, `getEnvApiKey`
 *                                                            ← `indusagi/ai`
 *   - `Settings`                                             ← `indusagi/shell-app`
 *
 * The launch layer never re-declares these; it composes them. The credential
 * vault (`AuthVault`) is an app-owned forward declaration here because the
 * framework publishes no credential-store type; Phase 2 supplies the concrete
 * multi-account vault.
 */
import type { SessionInfo as ResumeRef, SessionListProgress, ThinkingLevel } from "indusagi/agent";
import type { ImageContent, KnownProvider, ModelRegistry, OAuthCredentials } from "indusagi/ai";
import type { Settings } from "indusagi/shell-app";
import type { RunnerId } from "../boot/contract";
/**
 * Re-exported framework / boot vocabulary that launch consumers routinely need.
 *
 * {@link ResumeRef} is the launch-local alias for the framework session
 * descriptor surfaced by the resume picker.
 */
export type { ResumeRef, ThinkingLevel, SessionListProgress, ImageContent, KnownProvider, ModelRegistry, OAuthCredentials, Settings, RunnerId, };
/**
 * The three terminal output modes the launch layer can resolve to. These map
 * one-to-one onto the boot {@link RunnerId} the orchestrator dispatches on:
 *
 *   - `text` — interactive terminal or a single human-readable answer.
 *   - `json` — a single non-interactive request whose result is structured.
 *   - `rpc`  — the headless line protocol for a driving parent process.
 *
 * `text` is the interactive default; `json` is selected by `--print` together
 * with a structured output toggle, and `rpc` by `--json` / `--rpc`.
 */
export type OutputMode = "text" | "json" | "rpc";
/**
 * The ordered reasoning-effort vocabulary accepted by `--thinking`, re-derived
 * here as a single source of truth for the parser and the usage generator.
 *
 * `off` disables extended reasoning entirely; the remaining rungs ascend in
 * effort. The tuple is `readonly` and ordered so the usage text can enumerate it
 * and so {@link isThinkingEffort} can validate against it without a second list.
 * It is a superset-compatible widening of the framework {@link ThinkingLevel}
 * (which omits `off`); callers that hand a level to the framework drop `off`.
 */
export declare const THINKING_EFFORTS: readonly ["off", "minimal", "low", "medium", "high", "xhigh"];
/** One reasoning-effort rung from {@link THINKING_EFFORTS}. */
export type ThinkingEffort = (typeof THINKING_EFFORTS)[number];
/**
 * Narrow an arbitrary string to a {@link ThinkingEffort}.
 *
 * Pure membership test against {@link THINKING_EFFORTS}; the model resolver
 * reuses it to parse the `model:effort` shorthand without importing the parser.
 */
export declare function isThinkingEffort(value: string): value is ThinkingEffort;
/** Narrow an arbitrary string to an {@link OutputMode}. */
export declare function isOutputMode(value: string): value is OutputMode;
/**
 * The closed roster of built-in tool names the `--tools` / `--no-tools` flags
 * select against. A literal tuple (rather than the live tool map) so the launch
 * layer can validate a `--tools` list before any tool module is constructed.
 */
export declare const TOOL_NAMES: readonly ["read", "write", "edit", "bash", "grep", "find", "ls", "task", "todo_read", "todo_write", "web_fetch", "web_search", "composio"];
/** One built-in tool identifier from {@link TOOL_NAMES}. */
export type ToolName = (typeof TOOL_NAMES)[number];
/** Narrow an arbitrary string to a known {@link ToolName}. */
export declare function isToolName(value: string): value is ToolName;
/**
 * The value vocabulary a flag binds to its target field.
 *
 *   - `boolean` — a bare switch; presence sets it true (e.g. `--print`).
 *   - `string`  — consumes the following token as text (e.g. `--model`).
 *   - `number`  — consumes the following token and coerces to a finite number.
 *   - `list`    — accumulates; either repeated or one comma-separated token
 *                 (e.g. `--mcp a --mcp b`, or `--tools read,bash`).
 */
export type FlagKind = "boolean" | "string" | "number" | "list";
/**
 * The default value attached to a {@link FlagSpec}, narrowed by {@link FlagKind}:
 * a boolean default for switches, a string for value flags, a number for numeric
 * flags, and a string array for lists.
 */
export type FlagDefault = boolean | string | number | readonly string[];
/**
 * One row of the single declarative flag table.
 *
 * Every recognised option is described here exactly once. The reader indexes the
 * table by {@link name} and {@link aliases} to bind tokens to
 * {@link Invocation.flags}; the usage generator walks the same rows to render the
 * option reference. There is no second source of truth for either side.
 */
export interface FlagSpec {
    /**
     * Canonical long spelling, leading dashes included (e.g. `"--model"`). This is
     * also the key the parsed value lands under in {@link Invocation.flags}, sans
     * the leading dashes.
     */
    readonly name: string;
    /**
     * Accepted alternate spellings — short forms (`"-m"`) and synonyms
     * (`"--rpc"` for `"--json"`). All alias hits normalise to {@link name}.
     */
    readonly aliases?: readonly string[];
    /** The value vocabulary this flag binds (see {@link FlagKind}). */
    readonly kind: FlagKind;
    /** One-line description rendered verbatim in the generated usage text. */
    readonly describe: string;
    /**
     * Optional default folded into {@link Invocation.flags} when the flag is
     * absent. Its runtime type must match {@link kind}.
     */
    readonly default?: FlagDefault;
}
/**
 * The fully parsed command line — the launch layer's enrichment of the thin
 * boot {@link RunnerId}-routing shape into the complete, strongly-typed surface
 * the runtime reads.
 *
 * The first four members ({@link mode}, {@link prompt}, {@link flags},
 * {@link positionals}) are the superset of the boot-layer minimal invocation
 * (`positionals` is the renamed `rest`); everything below is the resolved launch
 * configuration. {@link flags} retains the loosely-typed bag for extension flags
 * and round-tripping, while the named fields below give consumers a precise,
 * pre-coerced view of the options that matter to the runtime. Treat every field
 * as read-only.
 */
export interface Invocation {
    /** Resolved terminal output mode; selects the boot runner. */
    readonly mode: OutputMode;
    /** First user message assembled from positionals, stdin, and attachments. */
    readonly prompt?: string;
    /** All parsed switches, keyed by canonical flag name (extension-flag escape hatch). */
    readonly flags: Record<string, FlagValue>;
    /** Positional tokens not consumed as flags (the boot layer's `rest`, renamed). */
    readonly positionals: string[];
    /** `@file` arguments expanded to inline prose plus base64 media, if any. */
    readonly attachments?: Attachments;
    /** Explicit model selector (`--model` / `-m`), provider-qualified or bare. */
    readonly model?: string;
    /** Model to fall back to when the selected model is overloaded mid-turn (`--fallback-model`). */
    readonly fallbackModel?: string;
    /** Named credential account to authenticate the run with (`--account`). */
    readonly account?: string;
    /** Working directory the run is scoped to (`--cwd`); absent means process cwd. */
    readonly cwd?: string;
    /** Replacement system prompt (`--system`); absent keeps the built-in. */
    readonly system?: string;
    /** Extra text appended after the system prompt (`--append-system`). */
    readonly appendSystem?: string;
    /** Reasoning-effort rung requested via `--thinking`. */
    readonly thinking?: ThinkingEffort;
    /** Explicit tool allow-list (`--tools`); absent means every built-in tool. */
    readonly tools?: ToolName[];
    /** Disable all tools for this run (`--no-tools`). */
    readonly noTools: boolean;
    /** External MCP server endpoints to attach (`--mcp`, repeatable / comma-joined). */
    readonly mcp: string[];
    /** Run a single request and exit, printing only the result (`--print` / `-p`). */
    readonly print: boolean;
    /** Force the interactive REPL even alongside a prompt (`--interactive` / `-i`). */
    readonly interactive: boolean;
    /** Asking for the usage banner (`--help` / `-h`). */
    readonly help: boolean;
    /** Asking for the version string (`--version` / `-v`). */
    readonly version: boolean;
}
/**
 * The runtime value a parsed flag can carry in {@link Invocation.flags}: a
 * boolean switch, a scalar value, a numeric value, or an accumulated list.
 */
export type FlagValue = boolean | string | number | string[];
/**
 * The result of expanding the `@file` arguments collected on the command line.
 *
 * Text files are inlined into {@link prose} (each wrapped in a delimited block
 * keyed by its path); image files are decoded to framework {@link ImageContent}
 * and collected in {@link media}. Both are concatenated onto the first user
 * message. An invocation with no `@file` arguments has no {@link Attachments} at
 * all rather than an empty one.
 */
export interface Attachments {
    /** Concatenated text of every inlined file, each wrapped with its path. */
    readonly prose: string;
    /** Base64 image content decoded from every image `@file` argument. */
    readonly media: ImageContent[];
}
/**
 * Options for {@link gatherAttachments}: the cwd the framework path resolver
 * resolves `@file` references against, and an optional progress sink.
 */
export interface AttachmentOptions {
    /** Working directory `@file` references are resolved relative to. */
    readonly cwd: string;
}
/**
 * The two verbs the credential command recognises as the first positional
 * token. Anything else means the command does not own this invocation and the
 * caller proceeds to normal launch.
 *
 *   - `signin`  — validate and store an api key for a provider / account.
 *   - `signout` — remove a stored credential for a provider / account.
 */
export type CredentialVerb = "signin" | "signout";
/**
 * A provider entry in the credential directory — the facts the sign-in prompts
 * print and validate against. {@link envKey} is the conventional environment
 * variable {@link getEnvApiKey} reads; {@link docsUrl} is where the user obtains
 * a key. These are external provider conventions, not derived data.
 */
export interface ProviderEntry {
    /** Stable provider id matching the framework {@link KnownProvider} vocabulary. */
    readonly id: KnownProvider | string;
    /** Human-facing provider label for menus and prompts. */
    readonly label: string;
    /** Conventional api-key environment variable for this provider. */
    readonly envKey: string;
    /** Page where a user obtains an api key for this provider. */
    readonly docsUrl: string;
}
/**
 * The closed set of failure categories the credential command can raise.
 * A consumer switches on {@link CredentialFault.kind}, never on message text:
 *
 *   - `unknown-provider` — the named provider is not in the directory.
 *   - `invalid-key`      — the supplied key failed format validation.
 *   - `invalid-account`  — the account name failed the naming rules.
 *   - `name-collision`   — the account name already exists for that provider.
 *   - `not-found`        — sign-out targeted a credential that is not stored.
 *   - `vault`            — the underlying credential store read/write failed.
 *   - `aborted`          — the user cancelled an interactive prompt.
 */
export type CredentialFaultKind = "unknown-provider" | "invalid-key" | "invalid-account" | "name-collision" | "not-found" | "vault" | "aborted";
/**
 * A typed credential failure. {@link kind} drives recovery; {@link hint} carries
 * a single actionable next step for the human (e.g. the env-var to set), and
 * {@link cause} preserves any wrapped error for diagnostics.
 */
export interface CredentialFault {
    /** The failure category (the discriminant). */
    readonly kind: CredentialFaultKind;
    /** Human-readable summary of what failed. */
    readonly message: string;
    /** Optional single actionable suggestion for resolving the fault. */
    readonly hint?: string;
    /** Optional wrapped underlying error. */
    readonly cause?: unknown;
}
/**
 * Construct a {@link CredentialFault}. A tiny inert helper so call sites raise a
 * well-formed typed fault without re-spelling the shape.
 */
export declare function credentialFault(kind: CredentialFaultKind, message: string, extra?: {
    hint?: string;
    cause?: unknown;
}): CredentialFault;
/**
 * The credential-vault surface the credential command depends on.
 *
 * The framework publishes no credential-store type, so the launch contract
 * forward-declares the slice it needs: per-provider, per-account records keyed by
 * an account name. A record stores *either* an api key or a set of
 * browser-sign-in credentials; the vault refreshes an expired browser token
 * before yielding a usable key. Phase 2 supplies the concrete multi-account
 * vault; this interface lets the credential command compile and be unit-tested
 * against an in-memory stand-in before then.
 */
export interface AuthVault {
    /** Stored account names for a provider, in insertion order. */
    listAccounts(provider: string): Promise<string[]>;
    /** The default account name for a provider, if one is set. */
    defaultAccount(provider: string): Promise<string | undefined>;
    /** Persist an api key under a provider / account, optionally as the default. */
    putApiKey(provider: string, account: string, apiKey: string, makeDefault?: boolean): Promise<void>;
    /**
     * Persist browser-sign-in credentials under a provider / account, optionally
     * as the default.
     */
    putOAuth(provider: string, account: string, credentials: OAuthCredentials, makeDefault?: boolean): Promise<void>;
    /**
     * Report whether a stored account holds an api key or browser-sign-in
     * credentials, or `undefined` when nothing is stored there.
     */
    authKind(provider: string, account: string): Promise<"apiKey" | "oauth" | undefined>;
    /**
     * Resolve a stored account to a live api-key string. An api-key record yields
     * its key verbatim; a browser-sign-in record is refreshed through the
     * framework (persisting any rotated token) before its usable key is returned.
     * Resolves `undefined` when nothing usable is stored.
     */
    readUsableKey(provider: string, account: string): Promise<string | undefined>;
    /** Remove a stored credential; resolves false when nothing was removed. */
    remove(provider: string, account?: string): Promise<boolean>;
}
/**
 * Options for {@link runCredentialCommand}: the resolved vault and the directory
 * the vault persists to. Injected so tests drive the command over an in-memory
 * vault with no real disk writes.
 */
export interface CredentialCommandOptions {
    /** The credential store to read and write. */
    readonly vault: AuthVault;
    /** Absolute directory the vault persists credentials under. */
    readonly profileDir: string;
}
/**
 * The filter applied when rendering the `--list-models` table. Every field is
 * optional; an absent field matches everything. {@link search} is a plain
 * case-insensitive substring test over the provider/model identifier — no fuzzy
 * matcher and no external ranking.
 */
export interface CatalogFilter {
    /** Restrict to a single provider id. */
    readonly provider?: KnownProvider | string;
    /** Keep only models that advertise a reasoning budget. */
    readonly thinkingOnly?: boolean;
    /** Keep only models that accept image input. */
    readonly imagesOnly?: boolean;
    /** Case-insensitive substring filter over the model identifier. */
    readonly search?: string;
}
/**
 * A function that loads a set of resumable sessions, reporting incremental
 * progress. The resume picker takes two: one for the current working
 * directory and one for every directory, both shaped like the framework
 * session lister.
 */
export type SessionLoader = (onProgress?: SessionListProgress) => Promise<ResumeRef[]>;
/**
 * A launch-time error from the resume flow (the React-Ink picker failing to
 * mount, or a session store read fault). Typed so the orchestrator can fall back
 * to a fresh session rather than crash.
 */
export interface ResumeFault {
    /** Human-readable summary of what failed. */
    readonly message: string;
    /** Optional wrapped underlying error. */
    readonly cause?: unknown;
}
/**
 * Options for {@link browseSettings}: the resolved settings, the directories of
 * user-authored resources to enumerate, the active cwd, and the profile
 * directory. The browser renders a plain console listing of these — no TUI.
 */
export interface SettingsBrowseOptions {
    /** The merged, resolved user settings. */
    readonly settings: Settings;
    /** Resolved absolute paths of discovered resources, grouped by category. */
    readonly resolvedPaths: Readonly<Record<string, readonly string[]>>;
    /** The active working directory. */
    readonly cwd: string;
    /** The profile directory the settings were loaded from. */
    readonly profileDir: string;
}
