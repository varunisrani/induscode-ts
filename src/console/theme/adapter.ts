// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Theme adapter binding — the single boundary where the console's semantic
 * tokens become concrete terminal colours.
 *
 * The framework renders colour through an {@link InkThemeAdapter}: a `colors`
 * Record plus chalk-backed `color(key, text)` / `background(key, …)` / `dim` /
 * `muted` helpers, all produced by `createThemeAdapter(name, colors)`. The
 * framework components look colours up by *their* key vocabulary (`accent`,
 * `error`, `success`, `warning`, `borderMuted`, `bashBorder`, `userMessage`,
 * `customMessage`, `text`, `dim`, `muted`). This module is the one place those
 * framework keys are populated — each from a console {@link ThemeTokens} role —
 * so the rest of the console never speaks the framework's key names and the
 * framework never sees a console role name.
 *
 * Keeping this mapping behind a single function means the config-load step calls
 * it exactly once per scheme; the resulting adapter is then threaded as the
 * `theme` prop through every framework component the surface mounts.
 */
import type { InkThemeAdapter, ThemeTokens } from "../contract";
/**
 * Project the console's semantic tokens onto the framework's colour-key Record.
 *
 * The keys here are the framework's own (the names its react-ink components pass
 * to `theme.color(...)` / `theme.background(...)`), each filled from a console
 * role. The framework's `createThemeAdapter` falls back gracefully for any key
 * it asks for that is absent, but we populate every key the shipped components
 * are known to request so nothing degrades to a default grey.
 *
 *   framework key   ← console role
 *   --------------    ------------------------------------------------
 *   text            ← bodyText      (default foreground / adapter fallback)
 *   dim             ← mutedText     (the adapter's `dim()` source)
 *   muted           ← mutedText     (the adapter's `muted()` source)
 *   accent          ← signal        (primary accent the components highlight in)
 *   borderMuted     ← quietFrame    (de-emphasised borders/separators)
 *   bashBorder      ← frame         (the bash-block border tone)
 *   userMessage     ← "" (no background, plain text)
 *   customMessage   ← cardAccent    (custom/plugin message background tint)
 *   success         ← affirm
 *   warning         ← caution
 *   error           ← alarm
 *   info            ← notice        (informational status tone)
 *   highlight       ← inkText       (high-contrast on-accent text)
 *
 * Plus the markdown / diff / syntax-highlight role keys the framework's rich
 * render path (`theme.role(...)` / `theme.roleBackground(...)`) resolves. These
 * key names match the framework adapter's default role → key map exactly, so the
 * styled transcript, colored diffs, and fenced-code highlighting resolve their
 * colours straight from the console's derived tokens:
 *
 *   codeInline      ← codeInline      (inline `code` foreground)
 *   heading         ← heading         (markdown heading foreground)
 *   blockquoteBar   ← blockquoteBar   (dim quote bar)
 *   diffAddedBg     ← diffAddedBg     (added-line background tint)
 *   diffRemovedBg   ← diffRemovedBg   (removed-line background tint)
 *   diffAddedText   ← diffAddedText   (added foreground / `+`)
 *   diffRemovedText ← diffRemovedText (removed foreground / `-`)
 *   synKeyword      ← synKeyword      (syntax: keywords)
 *   synString       ← synString       (syntax: strings)
 *   synNumber       ← synNumber       (syntax: numbers)
 *   synComment      ← synComment      (syntax: comments)
 *   synType         ← synType         (syntax: types / classes)
 *
 * @param tokens the derived semantic token map for a scheme
 * @returns a flat colour Record keyed by the framework's vocabulary
 */
export declare function frameworkColors(tokens: ThemeTokens): Record<string, string>;
/**
 * Build the framework {@link InkThemeAdapter} for a scheme from its tokens.
 *
 * The boundary call: derive the framework colour Record from the console's
 * semantic tokens, then hand it to `createThemeAdapter` under the scheme's name.
 * This is the *only* place `createThemeAdapter` is invoked for a console theme.
 *
 * @param schemeName the scheme identity, used as the adapter's `name`
 * @param tokens     the derived semantic token map for that scheme
 * @returns the chalk/ink-backed framework adapter
 */
export declare function themeAdapter(schemeName: string, tokens: ThemeTokens): InkThemeAdapter;
