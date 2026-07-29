/**
 * ThemeBridge — the color service behind the HTML transcript export.
 */
import { FALLBACK_EXPORT_THEME, type ExportTheme } from "../briefing/contract.js";

export function buildLuminanceLut(): Float64Array {
  const lut = new Float64Array(256);
  for (let v = 0; v < 256; v++) {
    const s = v / 255;
    lut[v] = s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }
  return lut;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function expandShortHex(body: string): string {
  if (body.length === 3 || body.length === 4) {
    return body
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return body.slice(0, 6);
}

function parseColor(color: string): Rgb | null {
  const text = color.trim().toLowerCase();
  if (text.startsWith("#")) {
    const body = expandShortHex(text.slice(1));
    if (!/^[0-9a-f]{6}$/.test(body)) return null;
    return {
      r: parseInt(body.slice(0, 2), 16),
      g: parseInt(body.slice(2, 4), 16),
      b: parseInt(body.slice(4, 6), 16),
    };
  }
  const fn = text.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[,\s/]+/).filter((p) => p.length > 0);
    if (parts.length < 3) return null;
    const channel = (p: string): number => {
      const n = p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p);
      return Number.isNaN(n) ? 0 : clampByte2(n);
    };
    return { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]) };
  }
  return null;
}

function clampByte2(value: number): number {
  if (value <= 0) return 0;
  if (value >= 255) return 255;
  return Math.round(value);
}

function formatColor(rgb: Rgb): string {
  const hex = (v: number): string => clampByte2(v).toString(16).padStart(2, "0");
  return `#${hex(rgb.r)}${hex(rgb.g)}${hex(rgb.b)}`;
}

function luminanceOf(rgb: Rgb, lut: Float64Array): number {
  const lr = lut[clampByte2(rgb.r)] ?? 0;
  const lg = lut[clampByte2(rgb.g)] ?? 0;
  const lb = lut[clampByte2(rgb.b)] ?? 0;
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(a: number, b: number): number {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function stepChannels(rgb: Rgb, amount: number): Rgb {
  return {
    r: clampByte2(rgb.r + amount),
    g: clampByte2(rgb.g + amount),
    b: clampByte2(rgb.b + amount),
  };
}

const LUMINANCE_LUT: Float64Array = buildLuminanceLut();
const MODE_THRESHOLD = 0.18;
const THEME_TOKENS = [
  "pageSurface",
  "cardSurface",
  "noteSurface",
  "ink",
  "inkMuted",
  "accent",
  "border",
  "userRole",
  "agentRole",
  "toolRole",
] as const;

export class DefaultThemeBridge {
  readonly theme: ExportTheme;
  readonly lut: Float64Array;

  constructor(
    theme: ExportTheme = FALLBACK_EXPORT_THEME,
    lut: Float64Array = LUMINANCE_LUT,
  ) {
    this.theme = theme;
    this.lut = lut;
  }

  luminance(color: string): number {
    const rgb = parseColor(color);
    return rgb === null ? 0 : luminanceOf(rgb, this.lut);
  }

  mode(): "light" | "dark" {
    return this.luminance(this.theme.pageSurface) >= MODE_THRESHOLD ? "light" : "dark";
  }

  deriveSurface(base: string, amount: number): string {
    const rgb = parseColor(base);
    if (rgb === null) return this.theme.cardSurface;
    return formatColor(stepChannels(rgb, amount));
  }

  readableInk(background: string): string {
    const bg = this.luminance(background);
    const ink = this.luminance(this.theme.ink);
    const muted = this.luminance(this.theme.inkMuted);
    return contrastRatio(ink, bg) >= contrastRatio(muted, bg)
      ? this.theme.ink
      : this.theme.inkMuted;
  }

  toCssVars(): Record<string, string> {
    const vars: Record<string, string> = {};
    for (const token of THEME_TOKENS) {
      vars[token] = this.theme[token];
    }
    return vars;
  }
}

export function createThemeBridge(theme?: ExportTheme): DefaultThemeBridge {
  return new DefaultThemeBridge(theme ?? FALLBACK_EXPORT_THEME);
}