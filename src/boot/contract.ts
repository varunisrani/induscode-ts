// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Boot-layer contract — the FROZEN type surface of Phase 1.
 *
 * This module is the single typed seam between the operating-system entry point
 * (`entry.ts`) and everything that turns a command line into a running coding
 * agent. It declares *only* shapes — no behavior, no I/O, no literals beyond the
 * narrow string unions that pin the public modes. Every later boot module
 * (workspace locator, upgrade registry, stage pipeline, runner registry) is
 * written against the names declared here, so this file is intentionally small,
 * append-mostly, and stable.
 *
 * Design stance:
 *   - One immutable {@link BootContext} is threaded through an ordered list of
 *     {@link Stage} transforms; a stage returns the next context (or the same
 *     one) and never mutates in place.
 *   - All branding lives in a single {@link Brand} record and all on-disk paths
 *     in a single {@link Workspace} object — there are no scattered free getters
 *     and no string literals duplicated across the codebase.
 *   - Where the rebuilt framework already owns a concept (the model catalog, the
 *     user-settings shape), the resolved-resource graph is typed against the
 *     framework's published types rather than re-declaring them here.
 *
 * Framework anchors (all from the `indusagi` package):
 *   - `ModelRegistry`  ← `indusagi/ai`     — the resolved model catalog.
 *   - `Settings`       ← `indusagi/shell-app` — the user-tunable config shape.
 *   - `ThinkingLevel`  ← `indusagi/agent`  — reasoning-effort vocabulary (re-exported
 *                                            for convenience by boot consumers).
 */
import type { ModelRegistry } from "indusagi/ai";
import type { Settings } from "indusagi/shell-app";
import type { ThinkingLevel } from "indusagi/agent";
/** Re-exported framework reasoning vocabulary, surfaced through the boot contract. */
export type { ThinkingLevel };
/**
 * The single source of truth for every branding / identity literal.
 *
 * Nothing else in the app hard-codes the product name, the profile directory
 * name, the bin names, the environment-variable namespace, or the share-viewer
 * origin. Resolving these once into a frozen record means a rebrand touches one
 * value, never a grep across the tree.
 */
export interface Brand {
    /** Product name used in banners and `process.title` (e.g. `"indusagi"`). */
    readonly name: string;
    /** Display label for human-facing surfaces; defaults to {@link name}. */
    readonly label: string;
    /** Profile directory leaf under the user's home (e.g. `".indusagi"`). */
    readonly profileDirName: string;
    /** Sub-directory of the profile holding the agent's own state (e.g. `"agent"`). */
    readonly stateDirName: string;
    /** The executable names this app installs as (both point at one entry). */
    readonly binNames: readonly [primary: string, alias: string];
    /** Environment-variable name prefix shared by all app-scoped vars (e.g. `"INDUSAGI"`). */
    readonly envPrefix: string;
    /** Env var overriding the resolved profile directory (e.g. `"INDUSAGI_CODING_AGENT_DIR"`). */
    readonly envProfileDir: string;
    /** Env var that, when set, disables transport-noise log filtering (e.g. `"INDUSAGI_DEBUG"`). */
    readonly envDebug: string;
    /** Env var overriding the share-viewer origin (e.g. `"INDUSAGI_SHARE_VIEWER_URL"`). */
    readonly envShareViewer: string;
    /** Default origin a published transcript links to. */
    readonly shareViewerUrl: string;
}
/**
 * Every resolved on-disk location the app reads or writes, as one immutable
 * record rather than a family of free `get*Path()` getters.
 *
 * All members are absolute paths already expanded against the user's home and
 * the active {@link Brand}; consumers join nothing further. A single object also
 * makes the layout trivially inspectable and swappable in tests.
 */
export interface Workspace {
    /** Root profile directory, e.g. `~/.indusagi/agent`. */
    readonly profileDir: string;
    /** Merged-settings file (`settings.json`). */
    readonly settingsPath: string;
    /** Consolidated credential store (`auth.json`). */
    readonly authPath: string;
    /** Per-cwd transcript directory root (`sessions/`). */
    readonly sessionsDir: string;
    /** Custom model-catalog overrides (`models.json`). */
    readonly modelsPath: string;
    /** Provisioned native helper binaries (`bin/`, holds fd / rg). */
    readonly toolsDir: string;
    /** Alias for the managed-binary directory; equals {@link toolsDir}. */
    readonly binDir: string;
    /** User-authored prompt/command templates (`prompts/`). */
    readonly promptsDir: string;
    /** User-installed color themes (`themes/`). */
    readonly themesDir: string;
    /** Bundled HTML transcript-export template directory. */
    readonly exportTemplateDir: string;
    /** Verbose diagnostic log file path. */
    readonly debugLogPath: string;
    /** External MCP server configuration (`mcp-servers.json`). */
    readonly mcpConfigPath: string;
    /** Memory-feature configuration (`memory.json`). */
    readonly memoryConfigPath: string;
    /** Composio-integration configuration (`composio.json`). */
    readonly composioConfigPath: string;
    /** On-disk memory database (`memory.db`). */
    readonly memoryDbPath: string;
}
/**
 * The three top-level execution modes the boot layer can dispatch to.
 *
 *   - `repl`    — interactive terminal session.
 *   - `oneshot` — single non-interactive request to stdout (text or JSON).
 *   - `link`    — headless JSON-RPC link for a driving parent process.
 */
export type RunnerId = "repl" | "oneshot" | "link";
/**
 * The parsed command line, reduced to what the boot layer needs to choose and
 * configure a {@link Runner}. This is the minimal Phase-1 shape; Phase 10 enriches
 * it with the full declarative flag surface. Raw, un-consumed tokens survive in
 * {@link rest} and loosely-typed switches in {@link flags} so nothing is lost
 * before the richer parser lands.
 */
export interface Invocation {
    /** Resolved execution mode. */
    readonly mode: RunnerId;
    /** First user message / request text, when supplied positionally or via stdin. */
    readonly prompt?: string;
    /** Explicit model selector from the command line, if any (`--model` / `-m`). */
    readonly modelId?: string;
    /** Model to fall back to when the bound model is overloaded mid-turn (`--fallback-model`). */
    readonly fallbackModelId?: string;
    /** Working directory the run is scoped to; absent means the process cwd (`--cwd`). */
    readonly cwd?: string;
    /** Named credential account to authenticate with (`--account`). */
    readonly account?: string;
    /** Reasoning effort (`--thinking`): off / minimal / low / medium / high / xhigh. */
    readonly thinking?: string;
    /** Replacement system prompt (`--system`); a path is read as a file, else literal text. */
    readonly system?: string;
    /** Extra text appended after the system prompt (`--append-system`); path-or-literal. */
    readonly appendSystem?: string;
    /** Allow-list of built-in tool names (`--tools`); absent means the full deck. */
    readonly tools?: readonly string[];
    /** Disable every built-in tool (`--no-tools`). */
    readonly noTools?: boolean;
    /** External MCP endpoint config paths to attach (`--mcp`). */
    readonly mcp?: readonly string[];
    /** Open the resume picker before the session starts (`--resume` / `-r`). */
    readonly resume?: boolean;
    /** Auto-resume the most recent session in the cwd (`--continue` / `-c`). */
    readonly continueLatest?: boolean;
    /** Print the model catalog and exit (`--list-models`). */
    readonly listModels?: boolean;
    /** Optional substring filter for `--list-models`. */
    readonly listModelsFilter?: string;
    /** Parsed switches, keyed by canonical flag name (values intentionally loose). */
    readonly flags: Record<string, unknown>;
    /** Positional / pass-through tokens not consumed as flags. */
    readonly rest: string[];
}
/**
 * Placeholder for the resolved per-account credential graph.
 *
 * The rebuilt framework publishes no credential type, so the boot contract owns
 * an opaque, forward-declared shape here; Phase 2 replaces it with the concrete
 * multi-account credential vault. Kept deliberately structural (an indexable
 * bag) so a stage may attach it without the vault module existing yet.
 */
export interface CredentialGraph {
    readonly [account: string]: unknown;
}
/**
 * The resolved settings / auth / model-registry graph assembled during startup.
 *
 * This is a Phase-1 placeholder: the fields are typed against the framework's
 * own published types where one exists ({@link Settings}, {@link ModelRegistry}),
 * and against an app-local placeholder ({@link CredentialGraph}) where the
 * framework does not yet own the concept. Later phases attach the loaded
 * extension/MCP graph onto the same object without changing these anchors.
 */
export interface StartupResources {
    /** Merged user settings (framework-owned shape). */
    readonly settings: Settings;
    /** Resolved credentials per account (app-owned placeholder until Phase 2). */
    readonly auth: CredentialGraph;
    /** The resolved model catalog (framework-owned registry). */
    readonly models: ModelRegistry;
}
/**
 * The immutable value threaded through the {@link Stage} pipeline.
 *
 * Each stage receives a context and returns the next one; treat every field as
 * read-only and produce successors by spreading rather than mutating. The
 * resolved-resource graph is optional because early stages run before it exists.
 * {@link closables} accumulates teardown callbacks (open files, servers, MCP
 * clients) that the entry point drains in reverse on exit.
 */
export interface BootContext {
    /** The process arguments the launch was invoked with (already sliced). */
    readonly argv: string[];
    /** Resolved on-disk layout. */
    readonly workspace: Workspace;
    /** Resolved identity literals. */
    readonly brand: Brand;
    /** Parsed command line. */
    readonly invocation: Invocation;
    /** Resolved settings/auth/model graph; absent until the resource stage runs. */
    readonly resources?: StartupResources;
    /** Teardown callbacks to drain on shutdown (latest-registered first). */
    readonly closables: Array<() => Promise<void>>;
}
/**
 * One step of the launch pipeline: a named, pure-ish transform over a context
 * value of type `C` (defaulting to {@link BootContext}).
 *
 * A stage may return its result synchronously or asynchronously. It must not
 * mutate its input; it returns the next context. The `name` is used for tracing
 * and error attribution when a stage throws.
 */
export interface Stage<C = BootContext> {
    /** Stable identifier for tracing and error messages. */
    readonly name: string;
    /** Transform the context, yielding its successor. */
    apply(ctx: C): Promise<C> | C;
}
/**
 * A terminal execution strategy for one {@link RunnerId} mode.
 *
 * The runner registry asks each runner whether it {@link accepts} a parsed
 * {@link Invocation}; the first match runs. {@link run} drives the selected mode
 * to completion and resolves to the process exit code.
 */
export interface Runner {
    /** The mode this runner serves. */
    readonly id: RunnerId;
    /** Whether this runner handles the given invocation. */
    accepts(inv: Invocation): boolean;
    /** Execute the mode; resolves to the process exit code. */
    run(ctx: BootContext): Promise<number>;
}
