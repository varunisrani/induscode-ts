// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Welcome-card content & per-session variation — the pure data behind the
 * "IndusCode Saffron" startup card (the boxed masthead the {@link Banner} draws
 * in its loud mode).
 *
 * This module holds *no* React or Ink: it is the render-agnostic source of the
 * card's rotating mascot, the rotating "getting started" tip, the static
 * "what's new" notes, the slash chips, and the small block-art robot mascot
 * geometry. The banner reads these and paints them through the theme adapter;
 * the geometry is returned as tone-tagged {@link MascotSegment}s so the banner
 * maps a tone → a colour role without re-deriving the layout.
 *
 * Per-session freshness ("every new session the welcome looks a little
 * different") is a *pure* selection: {@link pickWelcomeVariant} maps an integer
 * seed onto one mascot + one tip deterministically, so a test pins an exact
 * variant while the live surface seeds it once at mount from
 * {@link randomWelcomeSeed}. Nothing here reads a clock or mutates state — same
 * seed in, same variant out.
 */
/**
 * One robot-mascot face: the two eye glyphs and the three-cell mouth.
 *
 * The face is drawn into a fixed nine-cell-wide rounded head (see
 * {@link mascotRows}); only the eyes and mouth change between variants, so a
 * face is just those glyphs plus a human-readable key for tests/logs. Each eye
 * is exactly one display cell and the mouth exactly three so every face packs
 * into the same head outline without shifting the columns.
 */
export interface MascotFace {
    /** Stable identifier for the expression (for tests and selection logs). */
    readonly key: string;
    /** The left/right eye glyphs (one display cell each). */
    readonly eyes: readonly [string, string];
    /** The three-cell mouth glyph row. */
    readonly mouth: string;
}
/**
 * The rotating mascot expressions, in selection order.
 *
 * Each is the same rounded saffron head with dark eyes and a teal mouth — the
 * expression is the only thing that changes session to session.
 */
export declare const MASCOTS: readonly MascotFace[];
/** A drawn cell's colour intent, mapped to a theme role by the banner. */
export type MascotTone = "head" | "eye" | "mouth" | "feet";
/** One painted span of a mascot row: literal text plus its colour intent. */
export interface MascotSegment {
    /** The literal glyphs to draw. */
    readonly text: string;
    /** Which colour role the banner paints this span in. */
    readonly tone: MascotTone;
}
/**
 * Lay a {@link MascotFace} out into its drawable rows.
 *
 * Returns one array of {@link MascotSegment}s per terminal row of the mascot — a
 * five-row rounded head (top, eyes, mouth, base, feet). The head outline is the
 * `head` tone, the eyes the `eye` tone, the mouth the `mouth` tone, and the feet
 * the `feet` tone; the banner resolves each tone to a concrete colour. Every row
 * is the same nine-cell width (the feet row is centred under it), so the column
 * stays rectangular whichever expression is chosen.
 *
 * @param face the expression to lay out
 */
export declare function mascotRows(face: MascotFace): readonly (readonly MascotSegment[])[];
/**
 * The rotating "Tips for getting started" lines.
 *
 * One is shown per session (chosen by {@link pickWelcomeVariant}); the pool is
 * ordinary onboarding guidance so a returning user sees a different nudge each
 * launch rather than the same line forever.
 */
export declare const TIPS: readonly string[];
/**
 * The static "What's new" notes shown in the card's right column.
 *
 * These are stable per release (the banner can override them from a live
 * changelog); they describe the most recent user-facing changes.
 */
export declare const WHATS_NEW: readonly string[];
/** The chosen per-session presentation: one mascot face and one tip line. */
export interface WelcomeVariant {
    /** The mascot expression to draw this session. */
    readonly mascot: MascotFace;
    /** The "getting started" tip to show this session. */
    readonly tip: string;
}
/**
 * Pick the welcome card's mascot + tip for a session seed.
 *
 * Pure and total: the same seed always yields the same variant, and any integer
 * (including a negative one) lands on a valid mascot and tip. The mascot and the
 * tip are advanced by different strides of the seed so they do not move in
 * lock-step — two nearby seeds vary both independently.
 *
 * @param seed the per-session seed (e.g. from {@link randomWelcomeSeed})
 */
export declare function pickWelcomeVariant(seed: number): WelcomeVariant;
/**
 * The PINNED welcome-card variant seed. The card no longer rotates per session
 * (one stable brand look): seeded with this, {@link pickWelcomeVariant} always
 * resolves to the clean "focus" mascot (`MASCOTS[0]` — `●  ●` eyes, flat `───`
 * mouth) + the Shift+Tab tip (`TIPS[2]`). (`12 % MASCOTS.length === 0` → focus;
 * `Math.trunc(12 / MASCOTS.length) % TIPS.length === 2` → the Shift+Tab tip.) Swap
 * the mount back to {@link randomWelcomeSeed} to restore per-session rotation.
 */
export declare const PINNED_WELCOME_SEED = 12;
/**
 * Mint a fresh seed for the current session.
 *
 * Impure by design (it reads the RNG), so the live surface calls it *once* at
 * mount and threads the result into the otherwise-pure banner. Tests never call
 * this — they pass a fixed seed to {@link pickWelcomeVariant} instead.
 */
export declare function randomWelcomeSeed(): number;
