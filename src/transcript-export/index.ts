// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Transcript-export subsystem — public barrel.
 *
 * The HTML transcript publisher and its supporting machinery: the table-driven
 * SGR painter ({@link paintSgr}) that turns terminal-styled output into safe HTML
 * spans, the {@link ThemeBridge} that computes export colors from an
 * {@link ExportTheme} via a WCAG luminance LUT, the regenerated page-shell
 * {@link PAGE_SHELL} template with its `{{TOKEN}}` slots and {@link fill} helper,
 * and {@link publishTranscript} which renders a session transcript to a
 * standalone HTML document using `marked`, `highlight.js`, and the painter.
 *
 * Consumers import the publish surface from `src/transcript-export` rather than
 * reaching into individual modules.
 */
export { paintSgr, tokenizeSgr, foldSgr, SGR_CODE_TABLE } from "./sgr.js";
export {
  DefaultThemeBridge,
  createThemeBridge,
  buildLuminanceLut,
  parseColor,
  formatColor,
} from "./theme-bridge.js";
export { PAGE_SHELL, PAGE_STYLES, CLIENT_SCRIPT, fill } from "./template.js";
export {
  publishTranscript,
  type TranscriptEntry,
  type TranscriptWidget,
  type PublishOptions,
} from "./publish.js";
export {
  FALLBACK_EXPORT_THEME,
  SHELL_SLOTS,
  SGR_INITIAL_STATE,
  briefingFault,
} from "../briefing/contract.js";
export type {
  ExportTheme,
  ThemeMode,
  LuminanceLut,
  SgrState,
  SgrToken,
  SgrMutation,
} from "../briefing/contract.js";
