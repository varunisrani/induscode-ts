/**
 * Theme resolution — assemble the fully-resolved {@link ConsoleTheme} for each scheme.
 */
import { DEFAULT_SCHEME, isThemeScheme, type ConsoleTheme, type ThemeScheme } from "../contract.js";
import { PALETTES } from "./palette.js";
import { themeAdapter } from "./adapter.js";
import { deriveTokens } from "./tokens.js";

function assembleTheme(scheme: ThemeScheme, palette = PALETTES[scheme]): ConsoleTheme {
  const tokens = deriveTokens(palette);
  return {
    scheme,
    palette,
    tokens,
    adapter: themeAdapter(scheme, tokens)
  };
}

/** The built-in themes, fully resolved and keyed by {@link ThemeScheme}. */
export const THEMES: Readonly<Record<ThemeScheme, ConsoleTheme>> = {
  saffron: assembleTheme("saffron"),
  midnight: assembleTheme("midnight"),
  daylight: assembleTheme("daylight"),
  "midnight-cb": assembleTheme("midnight-cb"),
  "daylight-cb": assembleTheme("daylight-cb")
};

/**
 * Resolve a scheme name to its fully-built {@link ConsoleTheme}.
 */
export function resolveTheme(scheme?: string | null): ConsoleTheme {
  if (typeof scheme === "string" && isThemeScheme(scheme)) {
    return THEMES[scheme];
  }
  return THEMES[DEFAULT_SCHEME];
}

/** The schemes the console offers, in picker order. */
export const THEME_SCHEMES: readonly ThemeScheme[] = Object.keys(THEMES) as ThemeScheme[];