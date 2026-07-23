// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Banner — the "IndusCode Saffron" masthead the console renders above the
 * transcript.
 *
 * The startup chrome the surface mounts at the top of a session. Its loud
 * (default) mode has two presentations, switched by {@link BannerProps.started}:
 *
 *   - **Welcome card** (fresh session, no messages yet): a bordered card in the
 *     saffron brand look — a compact `● IndusCode v…` brand label, then two
 *     columns (left: a personalized greeting above a small block-art robot
 *     mascot and the bound model / working directory; right: a rotating "getting
 *     started" tip and the "What's new" notes). The mascot expression and the
 *     tip rotate per session (seeded once at mount and threaded in via
 *     {@link BannerProps.variantSeed}), so a new session looks a little different
 *     each time while staying deterministic for tests.
 *   - **Startup & Chat masthead** (once the user has sent a message): the
 *     `➜ dir git:(branch) indus` shell line, the block-letter "INDUS CODE"
 *     wordmark, the `indus console v…` brand line, the welcome line, and a
 *     bordered "Session" panel (model + cwd). The conversation itself is rendered
 *     below the banner by the surface's `MessageList`.
 *
 * It reads nothing but its props, holds no state, and runs no effects — purely
 * presentational Ink primitives themed through the framework
 * {@link InkThemeAdapter}. The {@link BannerProps.quiet} or
 * {@link BannerProps.compact} flags collapse all of that to a single compact
 * header line, still carrying the welcome line, the notices, and a condensed
 * changelog so nothing important is silently dropped.
 */
import { type InkThemeAdapter } from "indusagi/react-ink";
import type { StartupChangelog, StartupMap, StartupNotice } from "../startup";
/** What the {@link Banner} renders. */
export interface BannerProps {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** Canonical id of the model bound to the session. */
    readonly modelId: string;
    /** Working directory the session is scoped to. */
    readonly workspace: string;
    /** The product version shown on the brand line (e.g. the package VERSION). */
    readonly version: string;
    /**
     * Whether the conversation has begun (the user has sent at least one message).
     * When `false` the loud banner is the fresh-session welcome card; when `true`
     * it becomes the Startup & Chat masthead (wordmark + Session panel) that sits
     * above the transcript. Has no effect in {@link quiet}/{@link compact} modes.
     */
    readonly started?: boolean;
    /** The active VCS branch (for the masthead shell line), or `null`/absent outside a repo. */
    readonly branch?: string | null;
    /** Whether to render the extra diagnostics line. */
    readonly verbose?: boolean;
    /**
     * When set, the welcome card is suppressed in favour of a single compact
     * header line. Wired from the verbose / quiet-startup flag.
     */
    readonly quiet?: boolean;
    /**
     * When set, the masthead auto-condenses to a single emblem + brand + model
     * line (the repeat-launch presentation). Distinct from {@link quiet}, which is
     * the manual suppression toggle; either collapses the banner, but `compact`
     * keeps the small emblem and the welcome line.
     */
    readonly compact?: boolean;
    /**
     * The signed-in account label, used for the personalized "Welcome back,
     * {name}!" line. Absent → the plain "Welcome back!" fallback is shown.
     */
    readonly name?: string;
    /**
     * Opt-in static colour-sweep flourish (legacy; accepted for call-site
     * compatibility). The saffron welcome card paints from the theme roles and
     * does not consume this flag.
     */
    readonly sweep?: boolean;
    /**
     * The per-session variation seed. Selects which mascot expression + "getting
     * started" tip the card shows; the same seed always yields the same pair, so a
     * test pins an exact variant. Absent → the first (seed 0) variant.
     */
    readonly variantSeed?: number;
    /**
     * Optional override for the "What's new" notes (e.g. sourced from a live
     * changelog). Absent → the shipped {@link WHATS_NEW} copy.
     */
    readonly whatsNew?: readonly string[];
    /**
     * The gathered session resources (context docs, skills, prompts). Reserved:
     * the saffron welcome card shows quick-action chips in place of the old
     * "Startup Map" panel, so this is accepted for call-site compatibility (and to
     * keep the gathering machinery wired) but not rendered in the card.
     */
    readonly startup?: StartupMap;
    /** Out-of-band lines drawn above the card (errors, warnings, info). */
    readonly notices?: readonly StartupNotice[];
    /** The changelog survey rendered as a "What is new" block on a version bump. */
    readonly changelog?: StartupChangelog;
}
/**
 * Render the console masthead.
 *
 * In the default (loud) mode this is the saffron welcome card: a `● IndusCode
 * v…` brand label and a two-column body (greeting + mascot + model/cwd on the
 * left, a rotating tip + the "What's new" notes on the right). The
 * {@link BannerProps.quiet} or {@link BannerProps.compact} flags
 * collapse all of that to a single compact header line, still carrying the
 * welcome line, the notices, and a condensed changelog.
 *
 * @param props the brand/version context, session facts, and startup chrome
 */
export declare function Banner({ theme, modelId, workspace, version, started, branch, quiet, compact, name, variantSeed, whatsNew, notices, changelog, }: BannerProps): JSX.Element;
