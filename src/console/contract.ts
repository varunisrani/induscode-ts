// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Console contract — the FROZEN type surface of the interactive terminal shell.
 *
 * This module is the single typed seam between the coding-agent *product* and
 * the React/Ink front-end that drives a session from a live terminal. It
 * declares *only* shapes plus a handful of tiny inert helpers (a scheme-name
 * guard, a fresh empty-state constant, and a pure modal transition) — no
 * rendering, no `useInput` handlers, no I/O. Every later console module (the
 * reducer, the theme adapter binding, the slash registry, the keymap, the
 * completion engine, the paste coalescer, and the root surface component) is
 * written against the names declared here, so the file is intentionally small,
 * append-mostly, and stable.
 *
 * Design stance — the shell is *wiring*, not widgets:
 *
 *   1. **One immutable reducer state.** The whole terminal surface is reduced
 *      from a single {@link ConsoleState} value mutated only through a
 *      {@link ConsoleEvent} action union dispatched into {@link consoleReducer}.
 *      The discriminants are the console's own (`buffer:set`, `cursor:move`,
 *      `modal:open`, …) — they do not mirror any upstream reducer.
 *   2. **A data-driven slash registry.** Slash commands are rows in a
 *      {@link SlashRegistry}, never an `if`-ladder. Each {@link SlashCommand}
 *      carries a `name`, a `summary`, and a `run(ctx)` that drives the
 *      {@link SessionConductor} through a {@link SlashContext}. The dispatcher is
 *      one generic prefix matcher over the registry.
 *   3. **Theme behind the framework adapter.** The console speaks in semantic
 *      {@link ThemeTokens}; the concrete chalk/ink colours are produced once, at
 *      the config-load boundary, by mapping a {@link ThemePalette} through the
 *      framework `createThemeAdapter`. The accent ramp is the console's own.
 *   4. **The console drives a conductor.** {@link ConsoleProps} carries a
 *      {@link SessionConductor}; the surface subscribes to its
 *      {@link SessionSignal} stream and renders its {@link ConductorState}. The
 *      conductor surface is the runtime contract and is never re-declared here.
 *
 * Framework anchors (all from the `indusagi` package — the sibling rebuilt
 * framework this app targets):
 *   - `SessionSnapshot`, `ToolExecutionState`, `StatusMessage`, `UiDisplayBlock`,
 *     `InkThemeAdapter`  ← `indusagi/react-ink`
 *   - `ReactNode`, `Reducer`, `Dispatch`  ← `react` (the host React the
 *     react-ink components render against)
 *
 * Conductor anchors (the sibling Phase-2 runtime seam):
 *   - `SessionConductor`, `SessionSignal`, `ConductorState`  ← `../conductor`
 *
 * The contract never re-declares these; it composes them.
 */
import type { InkThemeAdapter, SessionSnapshot, StatusMessage, ToolExecutionState, UiDisplayBlock } from "indusagi/react-ink";
import type { Dispatch, ReactNode, Reducer } from "react";
import type { ConductorState, SessionConductor, SessionSignal } from "../conductor";
import type { PreferenceStore } from "../settings";
import type { SessionLibrary } from "../sessions";
import type { AuthVault, LoginProvider, OAuthLoginResult } from "../launch";
import type { OAuthLoginCallbacks } from "indusagi/ai";
/** Re-exported framework vocabulary that console consumers routinely need. */
export type { SessionSnapshot, ToolExecutionState, StatusMessage, UiDisplayBlock, InkThemeAdapter, };
/** Re-exported conductor vocabulary the console renders and drives. */
export type { SessionConductor, SessionSignal, ConductorState };
/**
 * The built-in colour schemes the console ships with.
 *
 * Named for the time-of-day they evoke rather than a bare light/dark axis, with
 * a daltonized (color-blind-friendly) variant of each:
 *   - `saffron`     — the IndusCode brand scheme: a warm saffron-on-cream dark
 *     terminal look with a cool teal accent. The shipped default.
 *   - `midnight`    — a low-luminance scheme for dark terminals.
 *   - `daylight`    — a high-luminance scheme for light terminals.
 *   - `midnight-cb` — the dark scheme re-derived so success vs failure separates
 *     off the red-green axis (success → blue), deuteran/protan-safe.
 *   - `daylight-cb` — the light scheme's color-blind-safe counterpart.
 */
export type ThemeScheme = "saffron" | "midnight" | "daylight" | "midnight-cb" | "daylight-cb";
/** The default scheme applied before any user preference is loaded. */
export declare const DEFAULT_SCHEME: ThemeScheme;
/**
 * Narrow an arbitrary string to a known {@link ThemeScheme}.
 *
 * The single sanctioned guard for scheme names, so every loader validates the
 * same way. Returns `true` only for a recognised scheme literal.
 *
 * @param value any candidate string read from settings or a slash argument
 */
export declare function isThemeScheme(value: string): value is ThemeScheme;
/**
 * The semantic colour/style tokens the console renders in.
 *
 * These are *roles*, not literals: a component asks for `frame` or `signal`,
 * never a hex code. Each token is a string key resolved to a concrete colour by
 * the framework {@link InkThemeAdapter} at the boundary; the console body never
 * touches a hex value directly. The token set is closed so a scheme that omits
 * one fails to type-check rather than rendering an undefined colour.
 *
 *   - `signal`       — the primary accent (active prompt, selection, focus).
 *   - `frame`        — default panel/border lines and structural chrome.
 *   - `quietFrame`   — de-emphasised borders and separators.
 *   - `promptSurface`— the composer's active background tint.
 *   - `cardAccent`   — accent applied to message-row gutters and headers.
 *   - `bodyText`     — default foreground for assistant/answer text.
 *   - `mutedText`    — secondary/metadata text (timestamps, hints).
 *   - `inkText`      — high-contrast text on an accented surface.
 *   - `notice`       — informational status tone.
 *   - `affirm`       — success status tone.
 *   - `caution`      — warning status tone.
 *   - `alarm`        — error/fault status tone.
 *   - `pending`      — busy/in-flight status tone.
 *
 * Rich-render roles (markdown / diff / syntax highlighting). These feed the
 * framework adapter's markdown/diff/highlight accessors so the styled
 * transcript, colored diffs, and fenced-code highlighting recolor for free with
 * each scheme:
 *   - `codeInline`     — inline `` `code` `` foreground.
 *   - `heading`        — markdown heading foreground.
 *   - `blockquoteBar`  — the dim bar drawn beside a blockquote.
 *   - `diffAddedBg`    — background tint for an added (`+`) diff line.
 *   - `diffRemovedBg`  — background tint for a removed (`-`) diff line.
 *   - `diffAddedText`  — foreground for added-line content / `+` marker.
 *   - `diffRemovedText`— foreground for removed-line content / `-` marker.
 *   - `synKeyword`     — syntax scope: keywords.
 *   - `synString`      — syntax scope: string literals.
 *   - `synNumber`      — syntax scope: numeric literals.
 *   - `synComment`     — syntax scope: comments.
 *   - `synType`        — syntax scope: types / classes / built-ins.
 */
export interface ThemeTokens {
    readonly signal: string;
    readonly frame: string;
    readonly quietFrame: string;
    readonly promptSurface: string;
    readonly cardAccent: string;
    readonly bodyText: string;
    readonly mutedText: string;
    readonly inkText: string;
    readonly notice: string;
    readonly affirm: string;
    readonly caution: string;
    readonly alarm: string;
    readonly pending: string;
    readonly codeInline: string;
    readonly heading: string;
    readonly blockquoteBar: string;
    readonly diffAddedBg: string;
    readonly diffRemovedBg: string;
    readonly diffAddedText: string;
    readonly diffRemovedText: string;
    readonly synKeyword: string;
    readonly synString: string;
    readonly synNumber: string;
    readonly synComment: string;
    readonly synType: string;
}
/** The closed set of token role names, for iteration and validation. */
export type ThemeToken = keyof ThemeTokens;
/**
 * The accent ramp a scheme is derived from — the console's own hex values.
 *
 * A {@link ThemePalette} is the small raw-colour source from which the full
 * {@link ThemeTokens} map is computed at load time. These nine stops are an
 * original ramp (re-derived for this console; they intentionally do not reuse
 * any upstream accent values) spanning a cool primary, a warm secondary, and a
 * neutral text gradient. The boundary adapter expands them into the semantic
 * token map and hands the result to `createThemeAdapter`.
 */
export interface ThemePalette {
    /** Primary accent — the dominant cool hue. */
    readonly primary: string;
    /** Secondary accent — a complementary warm hue. */
    readonly secondary: string;
    /** Tertiary accent — a muted support hue. */
    readonly tertiary: string;
    /** Brightest neutral — high-contrast text. */
    readonly ink: string;
    /** Mid neutral — default body text. */
    readonly body: string;
    /** Dim neutral — secondary/metadata text. */
    readonly muted: string;
    /** Success hue. */
    readonly affirm: string;
    /** Warning hue. */
    readonly caution: string;
    /** Error hue. */
    readonly alarm: string;
}
/**
 * A fully resolved scheme: identity, raw ramp, and the semantic token map the
 * console renders in.
 *
 * The {@link tokens} are derived from {@link palette} at load time; `adapter` is
 * the framework binding produced from those tokens. A scheme is the unit the
 * theme picker selects and the surface threads through every component as the
 * `theme` prop.
 */
export interface ConsoleTheme {
    /** Which scheme this resolves. */
    readonly scheme: ThemeScheme;
    /** The raw accent ramp this scheme was derived from. */
    readonly palette: ThemePalette;
    /** The semantic token map components render against. */
    readonly tokens: ThemeTokens;
    /** The framework adapter that turns token roles into terminal colours. */
    readonly adapter: InkThemeAdapter;
}
/**
 * The discriminant of a single rendered transcript row.
 *
 * The console renders its scrollback as a flat list of typed rows rather than a
 * single message blob, so each kind can be width-packed and themed
 * independently:
 *   - `prompt`   — a user-submitted turn.
 *   - `answer`   — streamed assistant answer text.
 *   - `reason`   — streamed reasoning/thinking text (shown only when enabled).
 *   - `toolRun`  — a tool invocation row, correlated by `runId`.
 *   - `notice`   — an out-of-band notice (changelog, status, system note).
 */
export type ViewRowKind = "prompt" | "answer" | "reason" | "toolRun" | "notice";
/**
 * One immutable row in the transcript view.
 *
 * Rows are append-mostly and identity-stable: a streaming `answer`/`reason` row
 * keeps its `id` while its `text` grows, so the renderer can reconcile in place.
 * `runId` correlates a `toolRun` row with its {@link ToolExecutionState} entry.
 */
export interface ViewRow {
    /** Stable unique row id. */
    readonly id: string;
    /** Which kind of row this is. */
    readonly kind: ViewRowKind;
    /** The row's display text (may be partial while streaming). */
    readonly text: string;
    /** Tool-run correlation id, present only for `toolRun` rows. */
    readonly runId?: string;
}
/**
 * The closed set of modal overlays the console can raise over the transcript.
 *
 * Exactly one modal is active at a time (or `none`). The surface renders the
 * matching framework dialog from a table keyed by this discriminant rather than
 * a hand-written switch:
 *   - `none`         — no overlay; the composer has focus.
 *   - `settings`     — the settings list.
 *   - `models`       — the single-model picker.
 *   - `scopedModels` — the per-scope model picker.
 *   - `theme`        — the scheme picker.
 *   - `sessions`     — the session resume/list picker.
 *   - `tree`         — the transcript-tree navigator.
 *   - `userTurns`    — the prior-user-turn picker (for branching/forking).
 *   - `signIn`       — the provider sign-in launcher.
 *   - `signOut`      — the provider sign-out confirmation.
 *   - `oauth`        — the in-flight OAuth device/redirect flow.
 *   - `plugin`       — a plugin-supplied select/confirm/input/custom overlay.
 *   - `approval`     — a pending tool-permission prompt (allow once / always / deny).
 */
export type ModalKind = "none" | "settings" | "models" | "scopedModels" | "theme" | "sessions" | "tree" | "userTurns" | "signIn" | "signOut" | "oauth" | "plugin" | "approval";
/**
 * The active modal plus any opaque payload the matching dialog needs.
 *
 * `payload` is deliberately untyped at the contract layer: each dialog narrows
 * it at its own boundary (e.g. the OAuth flow state, a plugin overlay request).
 * `none` carries no payload.
 */
export interface ModalState {
    /** Which overlay is currently raised. */
    readonly kind: ModalKind;
    /** Opaque per-modal payload, narrowed by the rendering dialog. */
    readonly payload?: unknown;
}
/** The inert "no overlay" modal state. */
export declare const NO_MODAL: ModalState;
/**
 * Compute the next {@link ModalState} for a requested transition.
 *
 * A pure, inert helper so the open/close/replace logic lives in one place
 * rather than being re-derived per call site. Opening any kind other than
 * `none` raises that overlay (carrying the optional payload); opening `none`
 * (or closing) returns {@link NO_MODAL}.
 *
 * @param next    the modal kind to transition to
 * @param payload optional payload for the target overlay
 */
export declare function transitionModal(next: ModalKind, payload?: unknown): ModalState;
/**
 * The immutable state the entire terminal surface is reduced from.
 *
 * Every observable property of the console — what is on screen, what is in the
 * composer, where the cursor sits, which overlay is up, and the display toggles
 * — is one read-only field here. The surface holds exactly one of these in a
 * reducer and never mutates it in place; a {@link ConsoleEvent} produces a fresh
 * value. Live session data (messages, usage, model) is *not* stored here — it is
 * projected from the conductor snapshot — so this state stays purely UI-local.
 */
export interface ConsoleState {
    /** The rendered transcript, newest row last. */
    readonly rows: readonly ViewRow[];
    /** Out-of-band display blocks (changelog, etc.) interleaved with the rows. */
    readonly blocks: readonly UiDisplayBlock[];
    /** The current composer text buffer. */
    readonly buffer: string;
    /** Caret offset within {@link buffer}, in characters. */
    readonly caret: number;
    /** The submitted-input ring, oldest first. */
    readonly history: readonly string[];
    /** Cursor into {@link history}, or `null` when not browsing history. */
    readonly historyAt: number | null;
    /** The buffer stashed before history browsing began, restored on exit. */
    readonly stash: string;
    /** The active modal overlay. */
    readonly modal: ModalState;
    /** The transient status line, when one is showing. */
    readonly status?: StatusMessage;
    /** The active colour scheme. */
    readonly scheme: ThemeScheme;
    /** Whether reasoning/thinking rows are shown. */
    readonly showReasoning: boolean;
    /** Whether inline images are rendered. */
    readonly showImages: boolean;
    /** Whether a turn is in flight (input disabled / spinner shown). */
    readonly busy: boolean;
    /** Monotonic tick that forces a status-bar re-render on data change. */
    readonly tick: number;
}
/**
 * The closed action union the console reducer folds over {@link ConsoleState}.
 *
 * The discriminants are the console's own `domain:verb` vocabulary. Grouped by
 * the slice each touches:
 *
 *   Composer buffer & caret
 *     - `buffer:set`        — replace the whole buffer (caret clamped).
 *     - `buffer:insert`     — splice text in at the caret.
 *     - `buffer:erasePrev`  — delete the character before the caret.
 *     - `buffer:eraseNext`  — delete the character after the caret.
 *     - `caret:move`        — move the caret by a signed delta.
 *     - `caret:jump`        — set the caret to an absolute offset.
 *
 *   History ring
 *     - `history:push`      — append the just-submitted input.
 *     - `history:back`      — recall the previous entry (stashes a live buffer).
 *     - `history:forward`   — recall the next entry (restores the stash at end).
 *
 *   Transcript view
 *     - `rows:set`          — replace the whole row list.
 *     - `rows:append`       — append one row.
 *     - `rows:patch`        — replace the text of the row matching an id.
 *     - `block:append`      — append a display block.
 *     - `blocks:clear`      — drop every display block (e.g. on a new session).
 *
 *   Overlays, status, theme, toggles, busy
 *     - `modal:open`        — raise an overlay (with optional payload).
 *     - `modal:close`       — drop back to the composer.
 *     - `status:set`        — show a transient status message.
 *     - `status:clear`      — clear the status line.
 *     - `scheme:set`        — switch the active colour scheme.
 *     - `toggle:reasoning`  — flip reasoning-row visibility.
 *     - `toggle:images`     — flip inline-image rendering.
 *     - `busy:set`          — set the in-flight flag.
 *     - `tick`              — bump the status-bar re-render tick.
 */
export type ConsoleEvent = {
    readonly type: "buffer:set";
    readonly text: string;
} | {
    readonly type: "buffer:insert";
    readonly text: string;
}
/** Swap the first occurrence of `find` for `replaceWith` (paste-marker growth). */
 | {
    readonly type: "buffer:replaceSpan";
    readonly find: string;
    readonly replaceWith: string;
} | {
    readonly type: "buffer:erasePrev";
} | {
    readonly type: "buffer:eraseNext";
} | {
    readonly type: "caret:move";
    readonly delta: number;
} | {
    readonly type: "caret:jump";
    readonly offset: number;
} | {
    readonly type: "history:push";
    readonly text: string;
} | {
    readonly type: "history:back";
} | {
    readonly type: "history:forward";
} | {
    readonly type: "rows:set";
    readonly rows: readonly ViewRow[];
} | {
    readonly type: "rows:append";
    readonly row: ViewRow;
} | {
    readonly type: "rows:patch";
    readonly id: string;
    readonly text: string;
} | {
    readonly type: "block:append";
    readonly block: UiDisplayBlock;
} | {
    readonly type: "blocks:clear";
} | {
    readonly type: "modal:open";
    readonly kind: ModalKind;
    readonly payload?: unknown;
} | {
    readonly type: "modal:close";
} | {
    readonly type: "status:set";
    readonly status: StatusMessage;
} | {
    readonly type: "status:clear";
} | {
    readonly type: "scheme:set";
    readonly scheme: ThemeScheme;
} | {
    readonly type: "toggle:reasoning";
} | {
    readonly type: "toggle:images";
} | {
    readonly type: "busy:set";
    readonly busy: boolean;
} | {
    readonly type: "tick";
};
/** The discriminant literals of {@link ConsoleEvent}, for filtering/logging. */
export type ConsoleEventType = ConsoleEvent["type"];
/** Extract a single member of {@link ConsoleEvent} by its `type`. */
export type ConsoleEventOf<T extends ConsoleEventType> = Extract<ConsoleEvent, {
    type: T;
}>;
/** The reducer signature the console store is built from. */
export type ConsoleReducer = Reducer<ConsoleState, ConsoleEvent>;
/** The bound dispatch function the surface threads to its children. */
export type ConsoleDispatch = Dispatch<ConsoleEvent>;
/**
 * The freshly-seeded {@link ConsoleState} a session opens with.
 *
 * A pure constant (no session data baked in) so the initial render is
 * deterministic and the store can be re-seeded without consulting any runtime.
 * Loaders overlay user preferences (scheme, toggles) on top of this base.
 */
export declare const EMPTY_CONSOLE_STATE: ConsoleState;
/**
 * The result a {@link SlashCommand.run} resolves to.
 *
 * A handler reports what it did so the dispatcher can react uniformly:
 *   - `handled`  — the command ran; nothing further is needed.
 *   - `prompt`   — the command produced text to be submitted as a normal turn
 *     (carried in `text`).
 *   - `unknown`  — the command name did not match; fall through to templates /
 *     plugin commands / a literal prompt.
 */
export type SlashOutcome = {
    readonly kind: "handled";
} | {
    readonly kind: "prompt";
    readonly text: string;
} | {
    readonly kind: "unknown";
};
/**
 * The capabilities a {@link SlashCommand.run} is handed to act on the console.
 *
 * The context is the command's whole world: it drives the {@link SessionConductor},
 * mutates UI state through {@link dispatch}, raises overlays, and surfaces status.
 * Keeping every effect behind this object lets the registry handlers stay pure
 * with respect to React internals and lets tests pass a scripted fake.
 */
export interface SlashContext {
    /** The raw argument string after the command name (may be empty). */
    readonly args: string;
    /** The session this console drives. */
    readonly conductor: SessionConductor;
    /** Dispatch a reducer event to mutate console state. */
    readonly dispatch: ConsoleDispatch;
    /** Raise a modal overlay. */
    readonly openModal: (kind: ModalKind, payload?: unknown) => void;
    /** Drop the active overlay. */
    readonly closeModal: () => void;
    /** Ask the host process to leave the interactive console (for `/quit`, `/exit`). */
    readonly requestExit: () => void;
    /** Show a transient status message. */
    readonly setStatus: (status: StatusMessage) => void;
    /** Replace the composer buffer (e.g. to pre-fill a follow-up). */
    readonly setBuffer: (text: string) => void;
    /** Append an out-of-band display block. */
    readonly appendBlock: (block: UiDisplayBlock) => void;
}
/**
 * One row in the slash registry.
 *
 * A command is pure data plus a `run`: the `name` is its canonical token
 * (without the leading slash), `summary` is the one-line description the
 * completion window shows, `aliases` are alternate tokens, and `family` groups
 * related commands (`composio`, `memory`, `scoped-models`, `theme`, …) for
 * listing. `run` performs the effect through a {@link SlashContext}.
 */
export interface SlashCommand {
    /** Canonical command token, without the leading slash. */
    readonly name: string;
    /** One-line description shown in the completion window. */
    readonly summary: string;
    /** Alternate tokens that resolve to this command. */
    readonly aliases?: readonly string[];
    /** The family this command belongs to, for grouped listing. */
    readonly family?: string;
    /** Whether the command accepts a trailing argument string. */
    readonly takesArgs?: boolean;
    /** Execute the command against the console. */
    run(ctx: SlashContext): SlashOutcome | Promise<SlashOutcome>;
}
/**
 * The registry the dispatcher resolves a typed slash line against.
 *
 * A flat, ordered list of {@link SlashCommand} rows plus a derived index. The
 * dispatcher walks this list once (the index is the fast path for exact/alias
 * lookups), so adding a command is appending a row — never editing a branch.
 */
export interface SlashRegistry {
    /** Every registered command, in listing order. */
    readonly commands: readonly SlashCommand[];
    /** Name/alias → command, for O(1) exact resolution. */
    readonly index: ReadonlyMap<string, SlashCommand>;
}
/**
 * The runtime handles the modal overlays reach for when they open.
 *
 * The console surface itself stays UI-local — it knows nothing about settings
 * files, the session catalog, or the credential store. Each overlay that needs
 * to drive one of those is handed this bundle (threaded through
 * {@link ConsoleProps.services}), so a dialog body can read/write a preference,
 * list and open saved sessions, enumerate sign-in providers, run a browser
 * login, and persist credentials — all without prop-drilling individual
 * dependencies through the surface. It is optional on {@link ConsoleProps}: the
 * headless and test mount paths run without it, and an overlay group that finds
 * it absent renders nothing.
 */
export interface OverlayServices {
    /** The session this console drives (model selection, branching, forking). */
    readonly conductor: SessionConductor;
    /** The two-tier preference reader/writer behind the settings overlays. */
    readonly settings: PreferenceStore;
    /** The catalog-and-navigation layer over persisted transcripts. */
    readonly sessions: SessionLibrary;
    /** Enumerate the merged sign-in directory (browser + api-key providers). */
    readonly listLoginProviders: () => LoginProvider[];
    /** Drive a provider's browser sign-in and persist the result through the vault. */
    readonly startOAuthLogin: (providerId: string, callbacks: OAuthLoginCallbacks, vault: AuthVault, account?: string) => Promise<OAuthLoginResult>;
    /**
     * Open a sign-in url in the user's browser (Chrome-first per platform).
     * Resolves `true` when a browser was launched, `false` otherwise — the OAuth
     * overlay calls this so the consent page opens automatically, matching the CLI
     * sign-in path.
     */
    readonly openLoginUrl: (url: string) => Promise<boolean>;
    /** The credential store sign-in / sign-out overlays read and write. */
    readonly vault: AuthVault;
    /**
     * Recompute the server-tier gateway routing map from current vault/token
     * state and push it onto the live conductor, so a sign-in that happens
     * mid-session (the "Indus Server" entry in `/login`) takes effect on the
     * NEXT turn without needing a session restart.
     */
    readonly refreshGatewayRouting: () => Promise<void>;
}
/**
 * What the root `TerminalConsole` surface receives at mount.
 *
 * The console is a consumer: it is handed a fully-assembled
 * {@link SessionConductor} to drive, the resolved {@link ConsoleTheme} to render
 * in, the {@link SlashRegistry} to dispatch against, and a small set of optional
 * seeds (a first message, preloaded images, a request-exit hook). It owns no
 * runtime of its own.
 */
export interface ConsoleProps {
    /** The session this console drives and renders. */
    readonly conductor: SessionConductor;
    /** The resolved colour scheme to render in. */
    readonly theme: ConsoleTheme;
    /** The slash-command registry the composer dispatches against. */
    readonly slash: SlashRegistry;
    /** An optional first user turn to submit on mount. */
    readonly initialInput?: string;
    /** Optional local image paths to attach to the first turn. */
    readonly initialImages?: readonly string[];
    /** Whether to render verbose diagnostics in the banner. */
    readonly verbose?: boolean;
    /** Invoked when the console asks the host process to exit. */
    readonly onExit?: () => void;
    /** The runtime handles the modal overlays drive; absent on headless paths. */
    readonly services?: OverlayServices;
}
/**
 * The ambient context the surface threads to its descendants.
 *
 * A narrow read-only handle on the things deep children need without prop
 * drilling: the conductor to drive and the exit request. Larger state flows
 * through the reducer, not this object.
 */
export interface ConsoleHost {
    /** The session this console drives. */
    readonly conductor: SessionConductor;
    /** Ask the host process to exit the interactive console. */
    readonly requestExit: () => void;
}
/** The minimal theme-prop a console component renders against. */
export interface Themed {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
}
/** A render slot a component may be asked to fill (header/footer/inline). */
export type RenderSlot = ReactNode;
