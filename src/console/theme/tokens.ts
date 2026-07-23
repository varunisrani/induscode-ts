// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Token derivation — expand a raw {@link ThemePalette} into the semantic
 * {@link ThemeTokens} the console actually renders against.
 *
 * The console body never names a hex or a palette stop; it names a *role*
 * (`signal`, `frame`, `bodyText`, `alarm`, …). This module is the one place the
 * thirteen roles are bound to ramp stops. The mapping is pure and total: every
 * key of {@link ThemeTokens} is assigned exactly once from a {@link ThemePalette}
 * field, so a ramp that is missing a stop fails to type-check rather than
 * producing an undefined colour at render time.
 *
 * Role → stop assignments (identical structure for both schemes; the schemes
 * differ only in the underlying ramp):
 *
 *   - `signal`        ← `primary`    (the dominant accent: focus, selection)
 *   - `frame`         ← `tertiary`   (default structural border lines)
 *   - `quietFrame`    ← `muted`      (de-emphasised separators)
 *   - `promptSurface` ← `secondary`  (the composer's active tint)
 *   - `cardAccent`    ← `secondary`  (row gutters and headers)
 *   - `bodyText`      ← `body`       (default answer foreground)
 *   - `mutedText`     ← `muted`      (timestamps, hints, metadata)
 *   - `inkText`       ← `ink`        (high-contrast text on an accent)
 *   - `notice`        ← `tertiary`   (informational tone)
 *   - `affirm`        ← `affirm`     (success tone)
 *   - `caution`       ← `caution`    (warning tone)
 *   - `alarm`         ← `alarm`      (error/fault tone)
 *   - `pending`       ← `primary`    (busy/in-flight tone)
 *
 * Rich-render roles (markdown / diff / syntax highlighting) are derived from the
 * same nine stops so the rebuild's new styled-transcript / colored-diff /
 * fenced-code surfaces recolour with the scheme and need no extra palette stop:
 *
 *   - `codeInline`      ← `primary`                      (inline code accent)
 *   - `heading`         ← `primary`                      (heading accent)
 *   - `blockquoteBar`   ← `muted`                        (dim quote bar)
 *   - `diffAddedBg`     ← `affirm` darkened toward ink   (added-line tint)
 *   - `diffRemovedBg`   ← `alarm`  darkened toward ink   (removed-line tint)
 *   - `diffAddedText`   ← `affirm`                       (added foreground / `+`)
 *   - `diffRemovedText` ← `alarm`                        (removed foreground / `-`)
 *   - `synKeyword`      ← `primary`                      (keywords)
 *   - `synString`       ← `affirm`                       (strings)
 *   - `synNumber`       ← `caution`                      (numbers)
 *   - `synComment`      ← `muted`                        (comments)
 *   - `synType`         ← `tertiary`                     (types / classes)
 *
 * Deriving the two diff backgrounds (rather than adding raw stops) keeps the
 * {@link ThemePalette} a flat nine-stop ramp while guaranteeing every scheme —
 * including the color-blind variants — gets a legible `+`/`-` tint that tracks
 * its own success/alarm hue.
 */
import type { ThemePalette, ThemeTokens } from "../contract";
/**
 * Map a raw accent ramp onto the closed semantic token set.
 *
 * Pure and deterministic: the same palette always yields the same tokens, and
 * the returned object is a fresh frozen value the resolver can cache. The role
 * assignments are shared by both schemes — only the ramp handed in differs.
 *
 * @param palette the raw nine-stop ramp for a scheme
 * @returns the full semantic token map (status + rich-render roles)
 */
export declare function deriveTokens(palette: ThemePalette): ThemeTokens;
