// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * ThemeBridge — the color service behind the HTML transcript export.
 *
 * Everything the publisher needs to turn an {@link ExportTheme} token bag into
 * concrete page colors lives here: parsing CSS colors into {@link Rgb}, measuring
 * a color's WCAG relative luminance through a precomputed lookup table, deciding
 * whether the theme reads {@link ThemeMode} light or dark, deriving lighter/darker
 * surface variants from a base, and projecting the whole theme to the CSS custom
 * properties the page shell consumes.
 *
 * Two facts are interface-dictated and kept faithful:
 *   - The WCAG relative-luminance formula — linearize each sRGB channel with the
 *     gamma piecewise curve, then weight `0.2126 R + 0.7152 G + 0.0722 B`. The
 *     per-channel linearization is precomputed once into {@link buildLuminanceLut}
 *     (a {@link LuminanceLut}) so a luminance read is three table lookups plus a
 *     weighted sum, never a `pow` per pixel.
 *   - Readable foreground selection — given a background, pick the foreground
 *     (from the theme's own ink choices) whose contrast against that background is
 *     the larger, so text on any derived surface stays legible.
 *
 * Every default color the bridge falls back to is this rebuild's own
 * {@link FALLBACK_EXPORT_THEME} (a deep-slate palette), never a legacy export's
 * magic constant.
 */
import { type ExportTheme, type LuminanceLut, type Rgb, type ThemeBridge, type ThemeMode } from "../briefing/contract";
/**
 * Build the 256-entry sRGB→linear lookup table the WCAG relative-luminance
 * formula needs for each channel.
 *
 * For a channel value `v` in `0–255`, normalize to `s = v / 255`, then apply the
 * standard gamma-expansion: `s ≤ 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ^
 * 2.4`. The table holds the linearized value at each integer channel so a
 * luminance read avoids the per-call `pow`. The math is the published standard's;
 * the table is this module's.
 */
export declare function buildLuminanceLut(): Float64Array;
/**
 * Parse a CSS color string into its {@link Rgb} channels. Recognizes `#rgb`,
 * `#rrggbb` (and their alpha-bearing `#rgba` / `#rrggbbaa` forms, alpha dropped)
 * and the functional `rgb(r, g, b)` / `rgba(r, g, b, a)` notations. Any
 * unrecognized input resolves to `null`, which the bridge treats as "fall back to
 * the theme default" rather than throwing.
 *
 * @param color a CSS color string
 */
export declare function parseColor(color: string): Rgb | null;
/** Render an {@link Rgb} back to a `#rrggbb` CSS string. */
export declare function formatColor(rgb: Rgb): string;
/**
 * The concrete {@link ThemeBridge}. Holds a resolved {@link ExportTheme} and a
 * {@link LuminanceLut}, and serves every color query the publisher makes against
 * them. Pure with respect to its inputs — construction resolves the theme once and
 * the methods only read.
 */
export declare class DefaultThemeBridge implements ThemeBridge {
    readonly theme: ExportTheme;
    private readonly lut;
    /**
     * @param theme an {@link ExportTheme} to serve; defaults to the rebuild's own
     *   {@link FALLBACK_EXPORT_THEME}.
     * @param lut   the luminance lookup table to read; defaults to the shared
     *   module-level table.
     */
    constructor(theme?: ExportTheme, lut?: LuminanceLut);
    /** The WCAG relative luminance (0–1) of a CSS color; unparseable input reads 0. */
    luminance(color: string): number;
    /** Whether the theme's page surface reads light or dark. */
    mode(): ThemeMode;
    /**
     * Derive a surface variant from a base color. The `amount` is a signed lightness
     * delta in channel space; the sign is honored directly so a caller can lighten
     * (`+`) or darken (`−`) explicitly. When `amount` is `0` the base is returned
     * formatted but unchanged. Unparseable bases fall through to the theme's card
     * surface so a derivation never yields an empty string.
     *
     * @param base   the base CSS color to adjust
     * @param amount signed lightness delta (positive lightens, negative darkens)
     */
    deriveSurface(base: string, amount: number): string;
    /**
     * Pick the more readable of the theme's two ink colors for a given background by
     * comparing each ink's WCAG contrast against it and returning the higher. This
     * is the bridge's own readable-foreground chooser — used when text sits on a
     * derived surface whose lightness is not known ahead of time.
     *
     * @param background the surface the text will sit on
     */
    readableInk(background: string): string;
    /** Project the theme to its CSS custom properties, keyed by token name. */
    toCssVars(): Readonly<Record<string, string>>;
}
/**
 * Build a {@link ThemeBridge} over an optional {@link ExportTheme}. The convenience
 * factory the publisher calls; omitting the theme yields a bridge over the
 * rebuild's own fallback palette.
 *
 * @param theme an export palette to serve, or undefined for the fallback
 */
export declare function createThemeBridge(theme?: ExportTheme): ThemeBridge;
