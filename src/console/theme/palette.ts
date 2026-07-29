/**
 * Theme palettes — the console's own re-derived accent ramps.
 */
import type { ThemePalette, ThemeScheme } from "../contract.js";

/** The dark-terminal ramp. */
export const MIDNIGHT_PALETTE: ThemePalette = {
  primary: "#3ad6b4",
  secondary: "#f0a24b",
  tertiary: "#7c9fe8",
  ink: "#f4f6fb",
  body: "#c3c8d4",
  muted: "#7e8696",
  affirm: "#46c98a",
  caution: "#e8b341",
  alarm: "#ef6a6a"
};

/** The light-terminal ramp. */
export const DAYLIGHT_PALETTE: ThemePalette = {
  primary: "#0f8f78",
  secondary: "#c26a10",
  tertiary: "#3a5ec0",
  ink: "#1c2230",
  body: "#3a4253",
  muted: "#6b7382",
  affirm: "#1d9d63",
  caution: "#a9740a",
  alarm: "#c4322f"
};

/** The "IndusCode Saffron" dark-terminal ramp — the brand scheme. */
export const SAFFRON_PALETTE: ThemePalette = {
  primary: "#f7a23f",
  secondary: "#3fd9b8",
  tertiary: "#b9a589",
  ink: "#fbf2e6",
  body: "#f3e9dc",
  muted: "#8a7a66",
  affirm: "#7fd8a8",
  caution: "#e8c172",
  alarm: "#e8736b"
};

/** The dark-terminal color-blind-safe ramp. */
export const MIDNIGHT_CB_PALETTE: ThemePalette = {
  ...MIDNIGHT_PALETTE,
  affirm: "#4aa3ff",
  caution: "#f2c75c",
  alarm: "#c83232"
};

/** The light-terminal color-blind-safe ramp. */
export const DAYLIGHT_CB_PALETTE: ThemePalette = {
  ...DAYLIGHT_PALETTE,
  affirm: "#1f6fd6",
  caution: "#8a5e00",
  alarm: "#b02622"
};

/** The raw ramp for each scheme, keyed by {@link ThemeScheme}. */
export const PALETTES: Readonly<Record<ThemeScheme, ThemePalette>> = {
  saffron: SAFFRON_PALETTE,
  midnight: MIDNIGHT_PALETTE,
  daylight: DAYLIGHT_PALETTE,
  "midnight-cb": MIDNIGHT_CB_PALETTE,
  "daylight-cb": DAYLIGHT_CB_PALETTE
};