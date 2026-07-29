/**
 * Token derivation — expand a raw {@link ThemePalette} into the semantic {@link ThemeTokens}.
 */
import type { ThemePalette, ThemeTokens } from "../contract.js";

function parseHex(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  const n = Number.parseInt(h.slice(0, 6).padEnd(6, "0"), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + [clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function mixHex(a: string, b: string, t: number) {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

function diffBackground(hue: string, anchor: string) {
  return mixHex(hue, anchor, 0.78);
}

function luminance(hex: string) {
  const [r, g, b] = parseHex(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function backgroundAnchor(palette: ThemePalette) {
  return luminance(palette.ink) >= 0.5 ? "#000000" : "#ffffff";
}

/**
 * Map a raw accent ramp onto the closed semantic token set.
 */
export function deriveTokens(palette: ThemePalette): ThemeTokens {
  const anchor = backgroundAnchor(palette);
  return {
    signal: palette.primary,
    frame: palette.tertiary,
    quietFrame: palette.muted,
    promptSurface: palette.secondary,
    cardAccent: palette.secondary,
    bodyText: palette.body,
    mutedText: palette.muted,
    inkText: palette.ink,
    notice: palette.tertiary,
    affirm: palette.affirm,
    caution: palette.caution,
    alarm: palette.alarm,
    pending: palette.primary,
    codeInline: palette.primary,
    heading: palette.primary,
    blockquoteBar: palette.muted,
    diffAddedBg: diffBackground(palette.affirm, anchor),
    diffRemovedBg: diffBackground(palette.alarm, anchor),
    diffAddedText: palette.affirm,
    diffRemovedText: palette.alarm,
    synKeyword: palette.primary,
    synString: palette.affirm,
    synNumber: palette.caution,
    synComment: palette.muted,
    synType: palette.tertiary
  };
}