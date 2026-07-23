// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Theme resolution — assemble the fully-resolved {@link ConsoleTheme} for each
 * scheme and expose the picker entry points.
 *
 * This is the top of the theme engine. It runs the pipeline once per scheme at
 * module load:
 *
 *   palette  ──deriveTokens──▶  tokens  ──themeAdapter──▶  framework adapter
 *      └──────────────────────────┴───────────────────────────┘
 *                          ConsoleTheme
 *
 * The two assembled themes are frozen into {@link THEMES}; {@link resolveTheme}
 * is the single sanctioned way the surface obtains the theme for a scheme name.
 * Because the heavy work (chalk adapter construction) happens here at the
 * config-load boundary, the render path only ever reads an already-built
 * {@link ConsoleTheme} — it never re-derives colours.
 */
import { type ConsoleTheme, type ThemeScheme } from "../contract";
/**
 * The built-in themes, fully resolved and keyed by {@link ThemeScheme}.
 *
 * Assembled once at load time from {@link PALETTES}. This is the table the
 * theme picker lists and {@link resolveTheme} reads; it is the console's
 * complete shipped theme set.
 */
export declare const THEMES: Readonly<Record<ThemeScheme, ConsoleTheme>>;
/**
 * Resolve a scheme name to its fully-built {@link ConsoleTheme}.
 *
 * The single entry point the surface and the loader use to turn a scheme name
 * (from settings, a slash argument, or the {@link DEFAULT_SCHEME}) into a theme.
 * An unrecognised or absent name falls back to {@link DEFAULT_SCHEME} rather
 * than throwing, so a corrupt preference never blanks the console.
 *
 * @param scheme a candidate scheme name, possibly invalid or undefined
 * @returns the resolved theme for that scheme, or the default theme
 */
export declare function resolveTheme(scheme?: string | null): ConsoleTheme;
/**
 * The schemes the console offers, in picker order.
 *
 * Derived from {@link THEMES} so adding a scheme to the table adds it to the
 * picker with no second list to update.
 */
export declare const THEME_SCHEMES: readonly ThemeScheme[];
