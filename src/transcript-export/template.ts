// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Page-shell template — the standalone HTML/CSS scaffold the transcript publisher
 * fills.
 *
 * This module is a freshly authored single-file page: its own element names
 * (`<main class="xscript">`, `.turn`, `.turn-tag`, `.turn-body`, `.tool-frame`,
 * `.aside-note`), its own stylesheet, and its own `{{TOKEN}}` placeholder names —
 * the {@link SHELL_SLOTS} values from the briefing contract
 * (`THEME_VARS`/`PAGE_SURFACE`/…/`MARKED_LIB`/`HIGHLIGHT_LIB`). None of the class
 * names, DOM structure, placeholder tokens, or color values are carried over from
 * any prior export template.
 *
 * The publisher computes a value for every slot and calls {@link fill} to splice
 * them in. The page is self-contained: theme colors arrive as CSS custom
 * properties in `:root`, the markdown and syntax-highlight libraries are inlined,
 * the session payload is embedded as base64, and a small client renderer
 * (the `SCRIPT` slot) hydrates the transcript on load.
 */
import { type ShellSlot } from "../briefing/contract";
/**
 * The page stylesheet, emitted into the `STYLES` slot. Reads its colors from the
 * `--x-*` custom properties the `THEME_VARS` slot defines, so re-theming is a
 * matter of changing the variables, not the rules. Class names are this page's
 * own (`xscript`, `turn`, `tool-frame`, `aside-note`, the `sgr-*` family the
 * painter emits, and the highlight `xhl` block).
 */
export declare const PAGE_STYLES: string;
/**
 * The client-side renderer, emitted into the `SCRIPT` slot. Decodes the base64
 * session payload, walks its turns, and renders each into the `.xscript` root
 * using the inlined `marked` (markdown) and `highlight.js` (code) libraries. Code
 * fences are highlighted into the page's own `xhl-*` classes; prose is parsed by
 * marked. Pre-rendered tool widgets and SGR-painted text arrive already-HTML in
 * the payload and are inserted verbatim.
 */
export declare const CLIENT_SCRIPT: string;
/**
 * The HTML page shell carrying every {@link SHELL_SLOTS} placeholder as a
 * `{{TOKEN}}` marker. {@link fill} replaces each marker with its computed value.
 * The structure: a themed `:root`, the inlined stylesheet, the two vendored
 * libraries, the base64 payload bound to `window.__XSCRIPT_PAYLOAD__`, and the
 * client renderer that hydrates `#xscript-root`.
 */
export declare const PAGE_SHELL = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n<title>Session Transcript</title>\n<style>\n:root {\n{{THEME_VARS}}\n  --x-page-surface: {{PAGE_SURFACE}};\n  --x-card-surface: {{CARD_SURFACE}};\n  --x-note-surface: {{NOTE_SURFACE}};\n}\n{{STYLES}}\n</style>\n</head>\n<body>\n<main class=\"xscript\">\n  <header class=\"xscript-head\">\n    <h1>Session Transcript</h1>\n    <div class=\"xscript-meta\">Self-contained HTML export</div>\n  </header>\n  <div id=\"xscript-root\"></div>\n</main>\n<script>\n/* {{MARKED_LIB}} */\n</script>\n<script>\n/* {{HIGHLIGHT_LIB}} */\n</script>\n<script>\nwindow.__XSCRIPT_PAYLOAD__ = \"{{PAYLOAD}}\";\n</script>\n<script>\n{{SCRIPT}}\n</script>\n</body>\n</html>";
/**
 * The map a {@link fill} call supplies — one value per {@link ShellSlot} token. A
 * value may be omitted, in which case its placeholder is replaced with the empty
 * string (so a partial fill leaves no stray `{{TOKEN}}` in the output).
 */
export type SlotValues = Partial<Record<ShellSlot, string>>;
/**
 * Replace every `{{TOKEN}}` placeholder in a template with the value supplied for
 * that slot, returning the filled string.
 *
 * Walks the known {@link SHELL_SLOTS} (not an open scan), so only sanctioned
 * placeholders are substituted and a stray `{{…}}` in user content is left
 * untouched. Each token is replaced globally; a slot with no supplied value
 * collapses to the empty string. The replacement is value-literal — a `$` in a
 * value does not trigger regex backreference expansion.
 *
 * @param template the shell carrying `{{TOKEN}}` markers
 * @param values   the per-slot values to splice in
 */
export declare function fill(template: string, values: SlotValues): string;
