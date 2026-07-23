// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Console theme engine — public barrel.
 *
 * The theme engine turns the console's own re-derived accent ramps into the
 * framework {@link InkThemeAdapter} every component renders against. The
 * pipeline is: a raw {@link ThemePalette} (this module's own hex ramp) →
 * semantic {@link ThemeTokens} via {@link deriveTokens} → a framework adapter
 * via {@link themeAdapter} → a fully resolved {@link ConsoleTheme}. The two
 * built-in schemes are assembled once into {@link THEMES} and obtained through
 * {@link resolveTheme}.
 *
 * Consumers import from `src/console/theme` and never reach into the individual
 * palette/tokens/adapter/resolve modules.
 */
export { SAFFRON_PALETTE, MIDNIGHT_PALETTE, DAYLIGHT_PALETTE, MIDNIGHT_CB_PALETTE, DAYLIGHT_CB_PALETTE, PALETTES, } from "./palette";
export { deriveTokens } from "./tokens";
export { themeAdapter, frameworkColors } from "./adapter";
export { THEMES, THEME_SCHEMES, resolveTheme } from "./resolve";
