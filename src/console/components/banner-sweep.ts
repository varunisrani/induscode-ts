// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Banner colour-sweep helpers — the pure, render-agnostic maths behind the
 * optional startup flourish (roadmap #14) and the personalized welcome line
 * (#7).
 *
 * Two concerns, no React or Ink, no I/O, no state:
 *
 *   - {@link rowGradient} computes a *frozen* (single-pass, no animation timer)
 *     colour for one wordmark row by lerping between two palette hexes across
 *     the block's rows. The banner paints row `i` of `n` with this colour when
 *     the opt-in sweep is on; off, the wordmark stays a flat accent. Because it
 *     takes no clock and never schedules a frame, it is reduced-motion safe by
 *     construction — the suppression decision lives at the call site, which
 *     simply does not ask for a gradient when motion is reduced.
 *
 *   - {@link welcomeLine} formats the "Welcome back{, name}!" greeting from the
 *     signed-in account label, with a length guard and a name-less fallback, so
 *     the banner and its tests share one formatter rather than re-deriving the
 *     string.
 *
 * Everything here is referentially transparent: same inputs → same output.
 */
/**
 * Format the personalized welcome greeting.
 *
 * Returns `"Welcome back, {name}!"` for a usable name, and the plain
 * `"Welcome back!"` fallback when the name is absent, blank, or too long to read
 * as a name. The name is trimmed of surrounding whitespace before the checks so
 * a padded label does not slip past the guards.
 *
 * @param name the signed-in account label, if one is known
 * @returns the greeting string (never the tag markup — plain text)
 */
export declare function welcomeLine(name?: string): string;
/**
 * The frozen sweep colour for one wordmark row.
 *
 * Lerps from `primaryHex` (the first row) to `secondaryHex` (the last row)
 * across the `rowCount` rows of the block, returning the colour for row
 * `rowIndex` as a `#rrggbb` hex string. A single-row block pins to the primary;
 * the endpoints are exact (row 0 = primary, row n-1 = secondary). If either hex
 * cannot be parsed, the corresponding raw input hex is returned so the banner
 * still gets a usable colour string rather than nothing.
 *
 * This computes a *static* gradient — there is no timer, no frame loop, no
 * clock. The whole sweep is laid down in the one render pass, which is exactly
 * why it is safe under reduced-motion: the flourish is colour, not movement.
 *
 * @param rowIndex     the zero-based row being painted
 * @param rowCount     the total number of rows in the wordmark block
 * @param primaryHex   the colour of the first row (e.g. the accent)
 * @param secondaryHex the colour of the last row (e.g. the secondary accent)
 * @returns a `#rrggbb` hex string (or a raw input hex when one is unparseable)
 */
export declare function rowGradient(rowIndex: number, rowCount: number, primaryHex: string, secondaryHex: string): string;
