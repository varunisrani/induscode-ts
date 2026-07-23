// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Briefing contract — the FROZEN type surface of the prompt-and-presentation
 * layer (Phase 9 / subsystem 10).
 *
 * This module is the single typed seam between the coding-agent's runtime state
 * and the two strings that layer produces: the LLM-facing **briefing** (the
 * system prompt) and the human-facing **transcript** (the published HTML
 * session). It declares *only* shapes plus a handful of tiny inert helpers — no
 * filesystem walks, no string assembly, no theme math — so every later module
 * (the section pipeline, the macro scanner, the capability-card loader, the SGR
 * painter, and the transcript publisher) is written against the names declared
 * here. The file is intentionally small, append-mostly, and stable.
 *
 * Design stance:
 *   - The briefing is **declarative, not a string template**. A {@link Briefing}
 *     is an ordered list of {@link BriefingSection}s, each a small descriptor
 *     that decides whether it applies to a {@link BriefingContext} and renders
 *     its own fragment. `composeBriefing` folds the enabled sections into the
 *     final prompt; there is no mega-literal with `{{TOKEN}}` placeholders.
 *   - Macros are a **single-pass `$arg` model**. A {@link Macro} carries a body
 *     and a source label; expansion is one left-to-right scan over the body that
 *     resolves `$1` / `$@` / `$ARGUMENTS` / `${@:N:L}` against a
 *     {@link MacroScope}. The contract names the token kinds and the scope; it
 *     does not run regexes.
 *   - A {@link SkillCard} is a CapabilityCard parsed from a `SKILL.md` document.
 *     The Agent-Skills *format* (frontmatter keys, name/description limits) is a
 *     public spec and is kept; the validation prose and field policy are the
 *     briefing's own.
 *   - ANSI styling is a **table-driven SGR machine**. {@link SgrState} is the
 *     running style; a {@link SgrToken} is one parsed unit (a text run or an SGR
 *     command); the SGR semantics are a published standard, the state shape is
 *     ours.
 *   - HTML-export color is computed behind a {@link ThemeBridge} over an
 *     {@link ExportTheme} token bag, with luminance read from a precomputed
 *     {@link LuminanceLut} (the WCAG relative-luminance formula is a standard;
 *     the LUT and the fallback colors are ours).
 *
 * Framework anchors (all from the `indusagi` package — the sibling rebuilt
 * framework this app targets):
 *   - `AgentState`, `AgentTool`       ← `indusagi/agent`
 *   - `TextContent`, `ImageContent`   ← `indusagi/ai`
 *
 * The briefing never re-declares these; it composes them.
 */
import type { AgentState, AgentTool } from "indusagi/agent";
import type { ImageContent, TextContent } from "indusagi/ai";
/** Re-exported framework vocabulary that briefing consumers routinely need. */
export type { AgentState, AgentTool, TextContent, ImageContent };
/**
 * The working context a {@link BriefingSection} reads when it decides whether to
 * apply and what to render.
 *
 * This is the data-driven replacement for the old string-template's placeholder
 * bag. Every field is optional so a section that does not need a given input
 * simply ignores it, and a caller can compose a partial briefing (e.g. one with
 * no skills, or no project docs) without populating the whole shape. A section
 * is pure with respect to this context: it reads, it never mutates.
 *
 *   - `workspace` — absolute working directory the session is scoped to; the
 *     footer section surfaces it and skills resolve relative paths against it.
 *   - `tools`     — the capabilities advertised this turn; the tools/guidelines
 *     sections gate themselves on which ids are present.
 *   - `cwd`       — alias kept distinct from `workspace` for sections that want
 *     the *display* path (may be relativized) versus the absolute root.
 *   - `skills`    — the {@link SkillCard}s eligible for model invocation; the
 *     skills section renders these into its block.
 *   - `subagents` — the named delegate roles to advertise in the delegate block.
 *   - `contextDocs` — project context documents (AGENTS-style files) to inline.
 *   - `now`       — the timestamp the footer stamps; injectable for determinism.
 *   - `extras`    — an open bag for app-novel sections to read bespoke inputs
 *     without widening this contract on every addition.
 */
export interface BriefingContext {
    /** Absolute working directory the session's briefing is scoped to. */
    readonly workspace?: string;
    /** The capabilities advertised this turn, by their wire-facing descriptors. */
    readonly tools?: readonly AgentTool[];
    /** Display path for the working directory (may be relativized). */
    readonly cwd?: string;
    /** Capability cards eligible for model invocation, for the skills block. */
    readonly skills?: readonly SkillCard[];
    /** Named delegate roles to advertise in the subagent/delegate section. */
    readonly subagents?: readonly SubagentBrief[];
    /** Project context documents to inline under a project-context section. */
    readonly contextDocs?: readonly ContextDoc[];
    /** Timestamp the footer stamps; injectable so renders are deterministic. */
    readonly now?: Date;
    /** Open bag for app-novel sections to read bespoke inputs. */
    readonly extras?: Readonly<Record<string, unknown>>;
}
/**
 * A named delegate role advertised in the subagent section of the briefing.
 *
 * The minimum a section needs to list a delegate the primary agent may hand work
 * to: a stable invocation `name`, a one-line `purpose`, and an optional `when`
 * hint describing the situations the role is suited to.
 */
export interface SubagentBrief {
    /** Stable name the primary agent uses to delegate to this role. */
    readonly name: string;
    /** One-line description of what the role is for. */
    readonly purpose: string;
    /** Optional hint describing when delegating to this role is appropriate. */
    readonly when?: string;
}
/**
 * A project-context document inlined into the briefing.
 *
 * Project files (AGENTS-style guidance) are surfaced under their own section so
 * the model can read repository conventions. `path` labels the source; `body` is
 * the verbatim text to inline.
 */
export interface ContextDoc {
    /** Source path of the document, used as its heading label. */
    readonly path: string;
    /** Verbatim document text to inline into the briefing. */
    readonly body: string;
}
/**
 * One declarative section of the briefing.
 *
 * The unit of the data-driven pipeline that replaces the old string template:
 * an ordered array of these is composed by `composeBriefing`, which renders each
 * applicable section and joins the fragments. A section owns its own gating —
 * via the optional {@link BriefingSection.applies} predicate — and its own
 * rendering, so adding a section is adding one descriptor to the array, not
 * editing a central literal.
 *
 *   - `id`     — stable identifier for ordering, dedup, and selective inclusion.
 *   - `title`  — optional human-facing heading the section may emit.
 *   - `applies`— optional predicate; when omitted the section always renders.
 *   - `render` — produce the section's fragment for a context. Returning an
 *     empty string is allowed and is dropped from the composed output.
 */
export interface BriefingSection {
    /** Stable identifier for ordering, dedup, and selective inclusion. */
    readonly id: string;
    /** Optional human-facing heading the section may emit. */
    readonly title?: string;
    /**
     * Decide whether this section contributes to a given context. When omitted
     * the section is treated as always applicable.
     *
     * @param ctx the working context to test against
     */
    applies?(ctx: BriefingContext): boolean;
    /**
     * Render this section's fragment for a context.
     *
     * Pure: reads `ctx`, returns a string, performs no I/O and mutates nothing.
     * An empty return is valid and is omitted from the composed briefing.
     *
     * @param ctx the working context to render against
     */
    render(ctx: BriefingContext): string;
}
/**
 * An ordered briefing recipe: the sections, in render order.
 *
 * `composeBriefing` walks this list, skips sections whose {@link
 * BriefingSection.applies} returns `false`, renders the rest, and joins the
 * non-empty fragments. The recipe is data; swapping the section set (or its
 * order) reconfigures the whole prompt without touching the composer.
 */
export type Briefing = readonly BriefingSection[];
/**
 * Inputs handed to `composeBriefing` to assemble a full briefing string.
 *
 * Pairs the {@link Briefing} recipe with the {@link BriefingContext} to render
 * it against, plus two override hooks that mirror the legacy custom-prompt path:
 * `prelude` text prepended ahead of the sections, and `append` text added after
 * them. Both are optional; the common case passes only `sections` and `context`.
 */
export interface BriefingInputs {
    /** The ordered section recipe to render. */
    readonly sections: Briefing;
    /** The context the sections render against. */
    readonly context: BriefingContext;
    /** Optional text prepended ahead of the rendered sections. */
    readonly prelude?: string;
    /** Optional text appended after the rendered sections. */
    readonly append?: string;
}
/**
 * Where a {@link Macro} was discovered, for labelling and precedence.
 *
 *   - `user`    — the per-user macro directory.
 *   - `project` — the project-local macro directory.
 *   - `path`    — an explicitly supplied path outside the standard roots.
 *   - `builtin` — a macro shipped with the app.
 */
export type MacroOrigin = "user" | "project" | "path" | "builtin";
/**
 * A user-defined slash macro: a named prompt body with `$arg` placeholders.
 *
 * Discovered from `*.md` files (frontmatter + body) under the user/project/path
 * roots. Invoking `/<name> args…` resolves the body against a {@link MacroScope}
 * built from the args, substituting the `$arg` tokens in one pass. The field
 * names are the briefing's own; the placeholder *syntax* is the shared cross-tool
 * convention and is preserved.
 *
 *   - `name`        — the invocation name (without the leading slash).
 *   - `description` — one-line summary for command listings; derived from
 *     frontmatter or the body's opening, with an `origin`-derived label.
 *   - `body`        — the prompt text containing the `$arg` placeholders.
 *   - `origin`      — where the macro was found, for labelling and precedence.
 *   - `source`      — absolute path of the file the macro was loaded from.
 */
export interface Macro {
    /** Invocation name, without the leading slash. */
    readonly name: string;
    /** One-line description for command listings. */
    readonly description: string;
    /** Prompt body containing `$arg` placeholders. */
    readonly body: string;
    /** Where the macro was discovered. */
    readonly origin: MacroOrigin;
    /** Absolute path of the file the macro was loaded from. */
    readonly source: string;
}
/**
 * The argument environment a {@link Macro} body is resolved against.
 *
 * Built from a parsed invocation: `args` is the positional vector (1-based in the
 * `$N` syntax, 0-based in this array), `all` is the original joined argument
 * string the `$@` / `$ARGUMENTS` tokens expand to, and `raw` is the untouched
 * text after the command name (kept for diagnostics and for tokens that want the
 * pre-split form). A token references this scope; the scanner reads it.
 */
export interface MacroScope {
    /** Positional arguments, in order; `$1` maps to index 0. */
    readonly args: readonly string[];
    /** The joined argument string `$@` / `$ARGUMENTS` expand to. */
    readonly all: string;
    /** The verbatim text following the command name, before splitting. */
    readonly raw: string;
}
/**
 * The kinds of unit the single-pass `$arg` scanner emits.
 *
 *   - `literal`    — a run of ordinary text copied through unchanged.
 *   - `positional` — a `$N` reference to one positional argument.
 *   - `all`        — a `$@` or `$ARGUMENTS` reference to the joined arguments.
 *   - `slice`      — a `${@:N}` / `${@:N:L}` reference to an argument sub-range.
 */
export type MacroTokenKind = "literal" | "positional" | "all" | "slice";
/**
 * One unit produced by the single-pass macro scanner.
 *
 * The body is scanned left-to-right into a flat token stream; resolving the
 * stream against a {@link MacroScope} and concatenating yields the expanded text.
 * This replaces the legacy multi-pass regex substitution with one scan emitting
 * these discriminated tokens.
 *
 *   - `literal`    carries its verbatim `text`.
 *   - `positional` carries the 1-based `index` of the argument it names.
 *   - `all`        carries nothing beyond its kind.
 *   - `slice`      carries the `start` offset and an optional `length`.
 */
export type MacroToken = {
    readonly kind: "literal";
    readonly text: string;
} | {
    readonly kind: "positional";
    readonly index: number;
} | {
    readonly kind: "all";
} | {
    readonly kind: "slice";
    readonly start: number;
    readonly length?: number;
};
/**
 * The parsed frontmatter of a `SKILL.md` document.
 *
 * The Agent-Skills format is a public spec, so these keys are kept; the policy
 * over them (which are required, which are allowed) is the briefing's own. Only
 * `name` and `description` carry semantics for the prompt; the rest are metadata
 * the loader preserves but does not interpret.
 *
 *   - `name`                   — the skill's invocation name; must match its
 *     directory and use lowercase hyphenated segments.
 *   - `description`            — required, single-line summary the model reads to
 *     decide when the skill applies.
 *   - `license`                — optional SPDX-style license tag.
 *   - `compatibility`          — optional free-form compatibility note.
 *   - `metadata`               — optional open key/value bag.
 *   - `allowedTools`           — optional restriction on which tools the skill
 *     may use while active.
 *   - `disableModelInvocation` — when true the skill is hidden from the briefing
 *     and exposed only as an explicit `/skill:<name>` command.
 */
export interface SkillFrontmatter {
    /** Invocation name; must match the parent directory, lowercase-hyphenated. */
    readonly name?: string;
    /** Required single-line summary the model reads to gate the skill. */
    readonly description?: string;
    /** Optional SPDX-style license tag. */
    readonly license?: string;
    /** Optional free-form compatibility note. */
    readonly compatibility?: string;
    /** Optional open metadata bag. */
    readonly metadata?: Readonly<Record<string, unknown>>;
    /** Optional restriction on tools the skill may use while active. */
    readonly allowedTools?: readonly string[];
    /** Hide from the briefing; expose only as an explicit command. */
    readonly disableModelInvocation?: boolean;
}
/**
 * A capability card loaded from a `SKILL.md` document.
 *
 * The resolved, validated form of one skill: its `name`, the `description` the
 * model reads, the markdown `body` (instructions loaded on demand), and the
 * on-disk `location` of the file. `origin` records where it was discovered and
 * `frontmatter` retains the parsed header for introspection. Unlike a deck
 * capability, a skill card is *documentation the model reads*, not a callable —
 * the model loads `location` with the reader when a task matches `description`.
 *
 *   - `name`        — the validated invocation name.
 *   - `description` — the single-line summary surfaced in the briefing.
 *   - `body`        — the markdown instruction text below the frontmatter.
 *   - `location`    — absolute path of the `SKILL.md` file.
 *   - `origin`      — where the card was discovered.
 *   - `frontmatter` — the parsed frontmatter, retained for introspection.
 */
export interface SkillCard {
    /** Validated invocation name. */
    readonly name: string;
    /** Single-line summary surfaced in the briefing. */
    readonly description: string;
    /** Markdown instruction text below the frontmatter. */
    readonly body: string;
    /** Absolute path of the `SKILL.md` file. */
    readonly location: string;
    /** Where the card was discovered. */
    readonly origin: MacroOrigin;
    /** Parsed frontmatter, retained for introspection. */
    readonly frontmatter: SkillFrontmatter;
}
/**
 * Outcome categories the skill loader can attach to a candidate file.
 *
 *   - `loaded`    — a valid card was produced.
 *   - `skipped`   — the file was ignored by policy (e.g. not a `SKILL.md`).
 *   - `invalid`   — the file was a skill but failed validation.
 *   - `collision` — a card with the same name already won; this one was dropped.
 */
export type SkillOutcomeKind = "loaded" | "skipped" | "invalid" | "collision";
/**
 * A single diagnostic the skill loader emits for one candidate file.
 *
 * Replaces the legacy parallel `{skills, diagnostics}` arrays with one tagged
 * record per candidate: `kind` is the outcome, `location` the file it concerns,
 * and `detail` a human-readable explanation written in the briefing's own voice.
 */
export interface SkillDiagnostic {
    /** Outcome category for the candidate. */
    readonly kind: SkillOutcomeKind;
    /** Absolute path of the candidate file the diagnostic concerns. */
    readonly location: string;
    /** Human-readable explanation of the outcome. */
    readonly detail: string;
}
/**
 * The aggregate result of loading skills from a set of roots.
 *
 * `cards` are the validated, deduped cards (first writer wins per name);
 * `diagnostics` is the flat stream of per-candidate outcomes for surfacing in a
 * load report. A consumer renders `cards` into the briefing and may show
 * `diagnostics` to the user.
 */
export interface SkillLoad {
    /** Validated, deduped cards in discovery order. */
    readonly cards: readonly SkillCard[];
    /** Per-candidate outcomes accumulated during the load. */
    readonly diagnostics: readonly SkillDiagnostic[];
}
/** Maximum length of a validated skill name, per the Agent-Skills format. */
export declare const SKILL_NAME_LIMIT = 64;
/** Maximum length of a validated skill description, per the format. */
export declare const SKILL_DESCRIPTION_LIMIT = 1024;
/**
 * The running display style of the table-driven SGR machine.
 *
 * As the painter scans an ANSI stream it folds each SGR command into this state
 * via the mutation table, then emits a styled span whenever a text run follows.
 * Colors are stored as resolved CSS color strings (or `null` for "inherit");
 * the boolean flags track the standard attribute set. The shape is the
 * briefing's own; the SGR *semantics* (which code sets which attribute) are the
 * published standard.
 *
 *   - `fg` / `bg`    — foreground / background color, or `null` for the default.
 *   - `bold`         — increased weight (SGR 1).
 *   - `dim`          — decreased intensity (SGR 2).
 *   - `italic`       — italic (SGR 3).
 *   - `underline`    — underline (SGR 4).
 *   - `blink`        — blink (SGR 5/6), rendered as an attribute hook.
 *   - `inverse`      — swap fg/bg at render time (SGR 7).
 *   - `hidden`       — concealed text (SGR 8).
 *   - `strike`       — crossed-out (SGR 9).
 */
export interface SgrState {
    /** Foreground color as a CSS color string, or `null` for the default. */
    readonly fg: string | null;
    /** Background color as a CSS color string, or `null` for the default. */
    readonly bg: string | null;
    /** Increased weight (SGR 1). */
    readonly bold: boolean;
    /** Decreased intensity (SGR 2). */
    readonly dim: boolean;
    /** Italic (SGR 3). */
    readonly italic: boolean;
    /** Underline (SGR 4). */
    readonly underline: boolean;
    /** Blink (SGR 5/6). */
    readonly blink: boolean;
    /** Swap foreground and background at render time (SGR 7). */
    readonly inverse: boolean;
    /** Concealed text (SGR 8). */
    readonly hidden: boolean;
    /** Crossed-out (SGR 9). */
    readonly strike: boolean;
}
/**
 * The neutral starting style of the SGR machine — every attribute off and both
 * colors at their default. A reset (SGR 0) returns the state to exactly this.
 */
export declare const SGR_INITIAL_STATE: SgrState;
/**
 * One unit produced by the SGR tokenizer.
 *
 * Scanning an ANSI stream splits it into an alternation of plain text runs and
 * SGR command sequences. The painter walks these tokens, applying `sgr`
 * parameter lists to the running {@link SgrState} and wrapping `text` runs in a
 * span styled by the state in force.
 *
 *   - `text` carries a run of printable characters to wrap.
 *   - `sgr`  carries the numeric parameter list of one `ESC[...m` sequence (an
 *     empty list means a bare `ESC[m`, equivalent to a reset).
 */
export type SgrToken = {
    readonly kind: "text";
    readonly text: string;
} | {
    readonly kind: "sgr";
    readonly params: readonly number[];
};
/**
 * A field-level mutation an SGR code applies to the running {@link SgrState}.
 *
 * The painter's dispatch table maps each handled SGR parameter to one of these
 * partial states; folding it over the current state yields the next state. This
 * is the data form of the SGR semantics — a table, not a switch — so the set of
 * handled codes is extended by adding table rows, not by editing control flow.
 */
export type SgrMutation = Partial<SgrState>;
/**
 * The color token bag the HTML transcript is themed with.
 *
 * These are the briefing's *own* token names and default values — deliberately
 * not the legacy export's. The publisher emits them as CSS custom properties and
 * the page shell reads them. `surface` family tokens are the large backgrounds;
 * `ink` is the body text color; `accent` tints interactive affordances; the
 * `role` tokens tint message attribution. Values are any CSS color string.
 *
 *   - `pageSurface`   — the outermost page background.
 *   - `cardSurface`   — the surface of a message card.
 *   - `noteSurface`   — the surface of an informational/system note.
 *   - `ink`           — primary body text color.
 *   - `inkMuted`      — secondary/de-emphasized text color.
 *   - `accent`        — interactive affordance tint.
 *   - `border`        — hairline/separator color.
 *   - `userRole`      — attribution tint for user turns.
 *   - `agentRole`     — attribution tint for assistant turns.
 *   - `toolRole`      — attribution tint for tool turns.
 */
export interface ExportTheme {
    /** Outermost page background. */
    readonly pageSurface: string;
    /** Surface of a message card. */
    readonly cardSurface: string;
    /** Surface of an informational/system note. */
    readonly noteSurface: string;
    /** Primary body text color. */
    readonly ink: string;
    /** Secondary/de-emphasized text color. */
    readonly inkMuted: string;
    /** Interactive affordance tint. */
    readonly accent: string;
    /** Hairline/separator color. */
    readonly border: string;
    /** Attribution tint for user turns. */
    readonly userRole: string;
    /** Attribution tint for assistant turns. */
    readonly agentRole: string;
    /** Attribution tint for tool turns. */
    readonly toolRole: string;
}
/**
 * The briefing's own fallback {@link ExportTheme} — a calm dark palette used
 * when the active UI theme supplies no export colors.
 *
 * Chosen fresh for this rebuild (a deep slate page over a muted blue accent);
 * none of these values are the legacy export's magic constants. The
 * {@link ThemeBridge} derives surface variants from these when a richer source
 * is unavailable.
 */
export declare const FALLBACK_EXPORT_THEME: ExportTheme;
/**
 * An RGB color decomposed into its 0–255 channels.
 *
 * The neutral intermediate the {@link ThemeBridge} parses a CSS color into
 * before computing luminance or deriving a brighter/darker variant. `parseColor`
 * produces one; `formatColor` renders one back to a CSS string.
 */
export interface Rgb {
    /** Red channel, 0–255. */
    readonly r: number;
    /** Green channel, 0–255. */
    readonly g: number;
    /** Blue channel, 0–255. */
    readonly b: number;
}
/**
 * A precomputed lookup table for the per-channel sRGB→linear step of the WCAG
 * relative-luminance formula.
 *
 * The formula is a published standard; computing it per pixel is wasteful, so
 * the {@link ThemeBridge} reads the linearized value of each 0–255 channel from
 * this table — one entry per channel value — and combines the three with the
 * standard weights. The table is ours (an implementation choice, expected to be
 * 256 entries long); the math it encodes is the standard.
 */
export type LuminanceLut = ArrayLike<number>;
/**
 * Whether a theme reads as light or dark, by the luminance of its page surface.
 *
 * The {@link ThemeBridge} branches surface derivation on this: a `light` base
 * darkens its variants, a `dark` base lightens them. The threshold is a fixed
 * midpoint of the relative-luminance range.
 */
export type ThemeMode = "light" | "dark";
/**
 * The color service behind the HTML transcript export.
 *
 * Replaces the legacy export's loose color functions and `{{TOKEN}}` string
 * replacement with one small typed service: it resolves an {@link ExportTheme},
 * reports the theme's {@link ThemeMode}, derives surface variants via luminance,
 * computes relative luminance through a {@link LuminanceLut}, and projects the
 * theme to the CSS custom properties the page shell consumes. Implementations
 * are pure with respect to their inputs.
 */
export interface ThemeBridge {
    /** The resolved export theme this bridge serves. */
    readonly theme: ExportTheme;
    /** Whether the theme reads as light or dark by page-surface luminance. */
    mode(): ThemeMode;
    /**
     * Compute the WCAG relative luminance (0–1) of a CSS color, reading the
     * per-channel sRGB→linear step from the bridge's {@link LuminanceLut}.
     *
     * @param color a CSS color string to measure
     */
    luminance(color: string): number;
    /**
     * Derive a surface variant from a base color by stepping its lightness toward
     * or away from the theme's {@link ThemeMode}.
     *
     * @param base   the base CSS color to adjust
     * @param amount signed lightness delta (positive lightens, negative darkens)
     */
    deriveSurface(base: string, amount: number): string;
    /**
     * Project the theme to the CSS custom properties the page shell reads, keyed
     * by their token name (e.g. `"pageSurface"`) with CSS color string values.
     */
    toCssVars(): Readonly<Record<string, string>>;
}
/**
 * A message payload fragment as it appears in a transcript node — the union the
 * publisher renders into a message card.
 *
 * Aliases the framework content parts (`TextContent` for prose, `ImageContent`
 * for inline images) so a persisted transcript node round-trips into the
 * publisher without a parallel content type. The publisher walks these and emits
 * the corresponding HTML fragment.
 */
export type TranscriptPart = TextContent | ImageContent;
/**
 * The pre-rendered HTML a custom (non-builtin) tool contributes to the
 * transcript, keyed back to its tool-call.
 *
 * Custom tools render their call and result through the widget rasterizer ahead
 * of page assembly; the publisher looks the result up by `callId` when it emits
 * that tool's card. A single `html` string carries the rendered block (the
 * legacy collapsed/expanded pair is intentionally flattened to one).
 */
export interface WidgetRender {
    /** The tool-call id this rendered block belongs to. */
    readonly callId: string;
    /** The rendered HTML block for the tool's call/result. */
    readonly html: string;
}
/**
 * Options that configure a single transcript publish.
 *
 * `theme` overrides the export palette (otherwise the fallback is used);
 * `title` labels the document; `outDir` chooses where the file is written; and
 * `widgets` supplies any pre-rendered custom-tool blocks to splice in. All are
 * optional — publishing a transcript with no options produces a themed,
 * self-contained file under the default location.
 */
export interface PublishOptions {
    /** Override export palette; defaults to {@link FALLBACK_EXPORT_THEME}. */
    readonly theme?: ExportTheme;
    /** Document title for the published page. */
    readonly title?: string;
    /** Directory to write the published file into. */
    readonly outDir?: string;
    /** Pre-rendered custom-tool blocks, keyed by their tool-call id. */
    readonly widgets?: readonly WidgetRender[];
}
/**
 * The placeholder token names the page shell template carries.
 *
 * The publisher interpolates each of these into the shell with a typed
 * substitution keyed off this object — replacing the legacy ad-hoc `{{TOKEN}}`
 * string replacement. The names are the briefing's own; the values are computed
 * at publish time (theme vars, surface colors, inlined CSS/JS, the base64
 * session payload, and the vendored library bodies).
 */
export declare const SHELL_SLOTS: {
    /** CSS custom-property block derived from the {@link ThemeBridge}. */
    readonly themeVars: "THEME_VARS";
    /** Resolved page-surface color. */
    readonly pageSurface: "PAGE_SURFACE";
    /** Resolved card-surface color. */
    readonly cardSurface: "CARD_SURFACE";
    /** Resolved note-surface color. */
    readonly noteSurface: "NOTE_SURFACE";
    /** Inlined stylesheet body. */
    readonly styles: "STYLES";
    /** Inlined client renderer body. */
    readonly script: "SCRIPT";
    /** Base64-encoded session payload. */
    readonly payload: "PAYLOAD";
    /** Inlined `marked` library body (MIT, license header preserved). */
    readonly markedLib: "MARKED_LIB";
    /** Inlined `highlight.js` library body (MIT, license header preserved). */
    readonly highlightLib: "HIGHLIGHT_LIB";
};
/** The literal slot-name type of {@link SHELL_SLOTS}. */
export type ShellSlot = (typeof SHELL_SLOTS)[keyof typeof SHELL_SLOTS];
/**
 * The closed set of failure categories this layer can surface.
 *
 *   - `skill_invalid` — a `SKILL.md` failed format validation.
 *   - `macro_invalid` — a macro file could not be parsed.
 *   - `publish`       — building or writing the HTML transcript failed.
 *   - `theme`         — a theme color could not be parsed or derived.
 */
export type BriefingFaultKind = "skill_invalid" | "macro_invalid" | "publish" | "theme";
/**
 * A typed, discriminated failure raised by the briefing/transcript layer.
 *
 * `kind` selects the category, `message` is a human-readable summary, and the
 * optional `cause` carries the underlying error for logging without forcing
 * consumers to parse the message. Construct one with {@link briefingFault}.
 */
export interface BriefingFault {
    /** Failure category — the discriminant consumers switch on. */
    readonly kind: BriefingFaultKind;
    /** Human-readable, single-line summary of what went wrong. */
    readonly message: string;
    /** Underlying error or structured detail, if any. */
    readonly cause?: unknown;
}
/**
 * Construct a {@link BriefingFault}. The single sanctioned way to mint one, so
 * the shape stays uniform across every producer.
 *
 * @param kind    the failure category
 * @param message a human-readable, single-line summary
 * @param cause   optional underlying error or structured detail
 */
export declare function briefingFault(kind: BriefingFaultKind, message: string, cause?: unknown): BriefingFault;
