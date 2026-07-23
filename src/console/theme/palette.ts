// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Theme palettes — the console's own re-derived accent ramps.
 *
 * This module owns the two raw {@link ThemePalette} values the console ships
 * with, one per {@link ThemeScheme}. A palette is the *source* nine-stop ramp a
 * scheme is built from: three accent hues (a cool primary, a warm secondary, a
 * muted support tertiary), a three-stop neutral text gradient (ink/body/muted),
 * and the three status hues (affirm/caution/alarm). Everything the console
 * renders is computed from these stops by the token derivation step — no module
 * downstream of here writes a literal hex.
 *
 * The hex values are an original ramp authored for this console. The cool
 * primary is a desaturated spring-green/teal, the warm secondary a tangerine
 * amber, and the support tertiary a soft periwinkle; the neutral gradient is a
 * cool slate. The `daylight` variant re-derives the same roles at higher
 * saturation / lower luminance so they read on a bright terminal background.
 * None of these stops reuse an upstream accent — they were picked fresh against
 * a contrast target for each role.
 */
import type { ThemePalette, ThemeScheme } from "../contract";
/**
 * The dark-terminal ramp.
 *
 * Cool spring-teal primary against a cool-slate neutral gradient, with a warm
 * amber secondary for contrast accents and a soft periwinkle support tone.
 */
export declare const MIDNIGHT_PALETTE: ThemePalette;
/**
 * The light-terminal ramp.
 *
 * The same role assignments re-derived deeper and more saturated so each hue
 * keeps its contrast against a bright background; the neutral gradient inverts
 * to a dark-on-light slate.
 */
export declare const DAYLIGHT_PALETTE: ThemePalette;
/**
 * The "IndusCode Saffron" dark-terminal ramp — the brand scheme.
 *
 * The console's signature look: a warm saffron primary (borders, headings, the
 * brand wordmark) against a cream neutral gradient, with a cool teal secondary
 * for the interactive accents (the prompt caret, chips, bullets) — the two hues
 * the IndusCode masthead is built from. The status hues stay warm-leaning so the
 * whole scheme reads as one saffron identity rather than a recoloured midnight.
 */
export declare const SAFFRON_PALETTE: ThemePalette;
/**
 * The dark-terminal color-blind-safe ramp.
 *
 * A clone of {@link MIDNIGHT_PALETTE} that re-derives the three *status* hues so
 * a red-green color-blind user (deuteran/protan, ~8% of men) can tell success
 * from failure without relying on the red-green axis. Success moves off green
 * onto a vivid blue (`affirm → #4aa3ff`); failure stays red but is deepened to a
 * darker tone (`alarm → #c83232`) so it sits well below the bright blue in
 * lightness, and the amber warning is nudged brighter — so the three status
 * tones separate by *lightness*, not hue alone. The three accent hues and the
 * neutral gradient are carried over unchanged from the base midnight ramp — only
 * the status stops move, so the overall look stays the midnight scheme.
 */
export declare const MIDNIGHT_CB_PALETTE: ThemePalette;
/**
 * The light-terminal color-blind-safe ramp.
 *
 * The daylight counterpart of {@link MIDNIGHT_CB_PALETTE}: clones
 * {@link DAYLIGHT_PALETTE} and remaps success to a deeper blue tuned for a
 * bright background (`affirm → #1f6fd6`), deepens the red alarm
 * (`alarm → #b02622`) for lightness separation from that blue, and darkens the
 * amber warning so the three status tones stay separable by lightness on a light
 * terminal too.
 */
export declare const DAYLIGHT_CB_PALETTE: ThemePalette;
/**
 * The raw ramp for each scheme, keyed by {@link ThemeScheme}.
 *
 * The token derivation step reads from this table; the resolver returns the
 * scheme whose palette it expanded.
 */
export declare const PALETTES: Readonly<Record<ThemeScheme, ThemePalette>>;
