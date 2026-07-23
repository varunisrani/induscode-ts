// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Settings subsystem — the typed surface of the user-tunable preferences an
 * interactive coding-agent session reads at startup and while it runs.
 *
 * This module declares *only* shapes and frozen defaults — no I/O, no class, no
 * filesystem. It is the single place every preference key is named, typed, and
 * given a fallback. The two-tier manager ({@link "./manager"}) is written
 * against the {@link Preferences} record declared here, and any console surface
 * that toggles a preference reads its value through the same record.
 *
 * Design stance:
 *   - Every key is optional on the record so a partially-written file is a
 *     legal {@link Preferences} value; the manager fills the gaps from
 *     {@link DEFAULT_PREFERENCES} when a reader asks for a concrete value.
 *   - Reasoning-effort vocabulary is borrowed from the framework
 *     ({@link ThinkingLevel}) rather than re-declared, so the agent and the UI
 *     speak the same words.
 *   - The other small string unions ({@link ColourScheme} is a free string,
 *     while {@link EscapeAction}) pin the surfaces a console reads.
 */
import type { ThinkingLevel } from "indusagi/agent";
/** Re-exported framework reasoning vocabulary, surfaced through this contract. */
export type { ThinkingLevel };
/**
 * What a double-tap of the escape key does in the interactive console.
 *
 *   - `tree`     — open the turn history as a navigable tree of branches.
 *   - `fork`     — open the prior-turn picker to branch off an earlier turn.
 *   - `clear`    — wipe the composer buffer.
 *
 * The legacy `rewind` / `branch` aliases are still accepted and treated as
 * `fork` / `tree` respectively so an older preference file keeps working.
 */
export type EscapeAction = "tree" | "fork" | "clear" | "rewind" | "branch";
/** Every {@link EscapeAction} value, as a frozen tuple for menus and guards. */
export declare const ESCAPE_ACTIONS: readonly EscapeAction[];
/** Narrow an arbitrary value to a known {@link EscapeAction}. */
export declare function isEscapeAction(value: unknown): value is EscapeAction;
/**
 * How a queue of pending turns (steering corrections or follow-up prompts) is
 * drained back into the run.
 *
 *   - `all`           — release every queued turn at once on the next handoff.
 *   - `one-at-a-time` — release a single queued turn per handoff.
 */
export type DeliveryMode = "all" | "one-at-a-time";
/** Every {@link DeliveryMode} value, as a frozen tuple for menus and guards. */
export declare const DELIVERY_MODES: readonly DeliveryMode[];
/** Narrow an arbitrary value to a known {@link DeliveryMode}. */
export declare function isDeliveryMode(value: unknown): value is DeliveryMode;
/**
 * How aggressively the per-tool permission gate auto-allows tool calls before it
 * falls back to asking (or denying):
 *
 *   - `default`      — consult the allow/ask/deny rules; read-only tools are
 *                      auto-allowed, anything else with no matching allow rule
 *                      falls through to `ask`.
 *   - `acceptEdits`  — additionally auto-allow filesystem edits/writes (the
 *                      mutating edit/write/multiedit tools), leaving everything
 *                      else on the `default` path.
 *   - `bypass`       — allow every tool with no prompt (the unsafe "trust all"
 *                      mode; `bypassPermissions` is accepted as an alias).
 *   - `plan`         — deny every mutating tool outright (read-only research only)
 *                      so the agent can plan without touching the workspace.
 */
export type PermissionMode = "default" | "acceptEdits" | "bypass" | "plan" | "bypassPermissions";
/** The canonical {@link PermissionMode} values, as a frozen tuple for menus/guards. */
export declare const PERMISSION_MODES: readonly PermissionMode[];
/** Narrow an arbitrary value to a known {@link PermissionMode} (folds the alias). */
export declare function isPermissionMode(value: unknown): value is PermissionMode;
/**
 * The declarative permission policy a session reads at startup.
 *
 * `allow`/`ask`/`deny` are ordered lists of induscode-style rule strings — a bare
 * tool name (`"Bash"`) or a tool name with an argument specifier
 * (`"Bash(npm run test:*)"`). Across tiers the three lists are concatenated, and
 * `deny` wins over `ask` wins over `allow`. `defaultMode` seeds the session's
 * permission mode when no flag overrides it. Every field is optional so an empty
 * `{}` (or an absent `permissions` key) keeps today's allow-all behavior.
 */
export interface PermissionSettings {
    /** Rule strings that auto-allow a matching tool call (lowest precedence). */
    allow?: string[];
    /** Rule strings that force a matching tool call to prompt for approval. */
    ask?: string[];
    /** Rule strings that hard-block a matching tool call (highest precedence). */
    deny?: string[];
    /** The permission mode the session opens in when no flag overrides it. */
    defaultMode?: PermissionMode;
}
/**
 * Every preference an interactive coding-agent session reads, as one flat,
 * fully-optional record.
 *
 * A value of this type may be the empty object (a brand-new install), a sparse
 * project override, or a fully-populated global file — all three are legal.
 * Concrete reads always go through the manager, which layers the project file
 * over the global file over {@link DEFAULT_PREFERENCES}, so a reader never sees
 * `undefined` for a key with a default.
 */
export interface Preferences {
    /** Named colour scheme the console renders with (e.g. `"midnight"`). */
    colourScheme?: string;
    /** Whether inline image content is rendered in the transcript. */
    showImages?: boolean;
    /** Whether the model's reasoning / thinking text is shown as it streams. */
    showReasoning?: boolean;
    /** When true, the reasoning block is folded away even if the model emits one. */
    hideThinking?: boolean;
    /** Whether oversized images are shrunk to fit before being handed to a provider. */
    imageAutoResize?: boolean;
    /** When true, image content is withheld from providers entirely. */
    blockImages?: boolean;
    /** Whether discovered skills are surfaced as their own slash commands. */
    enableSkillCommands?: boolean;
    /** How queued steering corrections are released back into the run. */
    steeringMode?: DeliveryMode;
    /** How queued follow-up prompts are released back into the run. */
    followUpMode?: DeliveryMode;
    /** Prefer a condensed changelog after the console updates itself. */
    collapseChangelog?: boolean;
    /** Reveal the terminal's own cursor instead of the software-drawn caret. */
    showHardwareCursor?: boolean;
    /** Horizontal padding, in columns, around the prompt editor. */
    editorPaddingX?: number;
    /** Glob / id patterns selecting which models appear in the picker; empty means all. */
    enabledModels?: string[];
    /** Provider id the session defaults to when none is named (e.g. `"anthropic"`). */
    defaultProvider?: string;
    /** Model id the session opens with under {@link defaultProvider}. */
    defaultModel?: string;
    /** Reasoning effort the session requests by default. */
    defaultThinkingLevel?: ThinkingLevel;
    /** Suppress the banner / tips shown on a normal interactive launch. */
    quietStartup?: boolean;
    /**
     * The last product version whose full masthead the user has already seen. The
     * banner auto-condenses to a one-line header when this equals the running
     * version (and nothing else demands the full block); it is rewritten to the
     * running version after the full masthead is shown, so a launch only shows the
     * big wordmark on the first sight of a version or a version bump.
     */
    lastSeenVersion?: string;
    /** Opt-in static colour-sweep flourish tinting the startup wordmark / emblem. */
    logoSweep?: boolean;
    /** When set, motion-flavoured flourishes (e.g. the logo sweep) are suppressed. */
    reducedMotion?: boolean;
    /** Whether the window-budget manager compacts the transcript automatically. */
    autoCompact?: boolean;
    /** What a double-escape does in the console. */
    doubleEscapeAction?: EscapeAction;
    /** Extension-package sources the launcher installs and loads (npm / git / local). */
    extensionPackages?: string[];
    /**
     * The declarative tool-permission policy: ordered allow/ask/deny rule lists and
     * the opening permission mode. Across the project/global tiers the rule lists
     * are concatenated (not overridden) and `deny > ask > allow` decides; an absent
     * value (or an empty object) preserves today's allow-all behavior.
     */
    permissions?: PermissionSettings;
}
/** The set of legal preference keys, derived from {@link Preferences}. */
export type SettingKey = keyof Preferences;
/**
 * The fallback value for every preference, used whenever neither the project
 * nor the global tier supplies a key.
 *
 * Frozen so it can be shared without a defensive copy; the manager spreads it
 * rather than mutating it. Every key in {@link Preferences} appears here with a
 * concrete (non-`undefined`) value, which is what lets a typed reader resolve a
 * guaranteed result.
 */
export declare const DEFAULT_PREFERENCES: Required<Preferences>;
/** Every preference key, as a frozen tuple for iteration and validation. */
export declare const SETTING_KEYS: readonly SettingKey[];
