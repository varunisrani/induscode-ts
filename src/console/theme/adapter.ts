/**
 * Theme adapter binding — the single boundary where the console's semantic tokens become concrete terminal colours.
 */
import { createThemeAdapter } from "indusagi/react-ink";
import type { InkThemeAdapter, ThemeTokens } from "../contract.js";

/**
 * Project the console's semantic tokens onto the framework's colour-key Record.
 */
export function frameworkColors(tokens: ThemeTokens): Record<string, string> {
  return {
    text: tokens.bodyText,
    dim: tokens.mutedText,
    muted: tokens.mutedText,
    accent: tokens.signal,
    borderMuted: tokens.quietFrame,
    bashBorder: tokens.frame,
    userMessage: "",
    customMessage: tokens.cardAccent,
    success: tokens.affirm,
    warning: tokens.caution,
    error: tokens.alarm,
    info: tokens.notice,
    highlight: tokens.inkText,
    codeInline: tokens.codeInline,
    heading: tokens.heading,
    blockquoteBar: tokens.blockquoteBar,
    diffAddedBg: tokens.diffAddedBg,
    diffRemovedBg: tokens.diffRemovedBg,
    diffAddedText: tokens.diffAddedText,
    diffRemovedText: tokens.diffRemovedText,
    synKeyword: tokens.synKeyword,
    synString: tokens.synString,
    synNumber: tokens.synNumber,
    synComment: tokens.synComment,
    synType: tokens.synType
  };
}

/**
 * Build the framework {@link InkThemeAdapter} for a scheme from its tokens.
 */
export function themeAdapter(schemeName: string, tokens: ThemeTokens): InkThemeAdapter {
  return createThemeAdapter(schemeName, frameworkColors(tokens));
}