// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Briefing subsystem — public barrel.
 *
 * Re-exports the FROZEN prompt-and-presentation contract: the declarative
 * system-prompt pipeline ({@link BriefingSection} over a {@link BriefingContext},
 * composed by `composeBriefing`), the single-pass `$arg` macro model
 * ({@link Macro}, {@link MacroScope}, {@link MacroToken}), the Agent-Skills
 * capability cards ({@link SkillCard} parsed from a `SKILL.md`), the table-driven
 * SGR machine ({@link SgrState}, {@link SgrToken}, {@link SgrMutation}), and the
 * HTML-transcript color layer ({@link ExportTheme} behind a {@link ThemeBridge}
 * with a {@link LuminanceLut}) plus the publish surface.
 *
 * Behavior modules land in this barrel as they are written. Currently exported:
 * the declarative section composer (`composeBriefing` over `BRIEFING_SECTIONS`),
 * the single-pass `$arg` macro scanner + loader (`loadMacros`, `applyMacros`,
 * and friends), and the Agent-Skills capability-card loader (`loadSkillCards`,
 * `gatherSkillCards`). The SGR painter, theme bridge, and transcript publisher
 * are added here as they land. Consumers import the briefing surface from
 * `src/briefing` rather than reaching into individual modules.
 */
export type { BriefingContext, BriefingSection, Briefing, BriefingInputs, SubagentBrief, ContextDoc, MacroOrigin, Macro, MacroScope, MacroTokenKind, MacroToken, SkillFrontmatter, SkillCard, SkillOutcomeKind, SkillDiagnostic, SkillLoad, SgrState, SgrToken, SgrMutation, ExportTheme, Rgb, LuminanceLut, ThemeMode, ThemeBridge, TranscriptPart, WidgetRender, PublishOptions, ShellSlot, BriefingFaultKind, BriefingFault, AgentState, AgentTool, TextContent, ImageContent, } from "./contract.js";
export { SKILL_NAME_LIMIT, SKILL_DESCRIPTION_LIMIT, SGR_INITIAL_STATE, FALLBACK_EXPORT_THEME, SHELL_SLOTS, briefingFault, } from "./contract.js";
export { BRIEFING_SECTIONS, composeBriefing, joinBlocks, bullets, escapeXml, TOOL_SUMMARIES } from "./compose.js";
export { scanMacroBody, resolveTokens, applyMacros, buildMacroScope, expandInvocation, loadMacros, readMacroFile, splitFrontmatter, } from "./macros.js";
export type { LoadMacrosOptions, FrontmatterSplit } from "./macros.js";
export { loadSkillCards, gatherSkillCards, modelInvocableCards, } from "./skills.js";
export type { SkillRoot } from "./skills.js";
export { gatherContextDocs } from "./context-docs.js";
export type { GatherContextDocsOptions } from "./context-docs.js";
