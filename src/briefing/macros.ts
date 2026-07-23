// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Macro loader + single-pass argument-template scanner.
 *
 * A macro is a named prompt body discovered from a `*.md` file under the user,
 * project, or an explicit path root. Invoking `/<name> rest-of-line` resolves
 * the body against the line's arguments, substituting the indus argument
 * placeholders.
 *
 * # Indus template format
 *
 * Indus's own placeholders use a double-curly `{{arg.…}}` form so they stand
 * out from ordinary shell-style text and never collide with stray `$` in prose.
 * Every placeholder is introduced with `{{arg.`, names one of a small set of
 * accessors, and closes with `}}`. Whitespace inside the braces is permitted
 * around the accessor and its numeric arguments but not required.
 *
 *   - `{{arg.1}}`, `{{arg.2}}`, …   — one positional argument (1-based).
 *   - `{{arg.all}}`                  — every positional argument, re-joined
 *                                      with single spaces (equivalent to the
 *                                      verbatim raw argument string for the
 *                                      common case where neither quoting nor
 *                                      runs of whitespace matter).
 *   - `{{arg.slice N L}}`            — at most `L` positionals starting at the
 *                                      1-based offset `N`, re-joined with
 *                                      single spaces.
 *   - `{{arg.slice N}}`              — positionals from `N` onward (1-based,
 *                                      inclusive).
 *   - `{{arg.rest N}}`               — positionals from `N` onward; an alias
 *                                      for `{{arg.slice N}}` that reads more
 *                                      naturally when "everything after the
 *                                      first few" is meant. `N` defaults to
 *                                      `2` (i.e. everything after `arg.1`)
 *                                      when omitted: `{{arg.rest}}`.
 *
 * A literal `{{` is written `{{{{` (doubled), so author-controlled body text
 * can still contain double-brace runs verbatim when needed.
 *
 * # Compatibility shim
 *
 * For backward compatibility with templates authored against the older
 * `$arg`-style syntax, a single-pass shim still recognises the legacy forms
 * and rewrites them on the fly:
 *
 *   - `$1`, `$2`, …    — one positional argument (1-based).
 *   - `$@`             — every positional, re-joined with single spaces.
 *   - `$ARGUMENTS`     — the whole original argument string, verbatim.
 *   - `${@:N}`         — positionals from N onward (1-based, inclusive).
 *   - `${@:N:L}`       — at most L positionals starting at N.
 *
 * Using any of these legacy forms invokes {@link reportLegacyUsage} so callers
 * can surface a deprecation notice in their UI; the expansion still produces
 * the expected text so existing macro files keep working.
 *
 * # Implementation discipline
 *
 * Substitution is **one left-to-right scan**, not a sequence of regex passes:
 * {@link scanMacroBody} walks the body character by character, emitting a flat
 * {@link MacroToken} stream (literal runs interleaved with positional / all /
 * slice references), and {@link applyMacros} resolves that stream against a
 * {@link MacroScope} and concatenates. A single scan means a character produced
 * by expanding one token can never be re-interpreted as the start of another —
 * the classic multi-pass footgun — and the tokenization is reusable (cache the
 * tokens, resolve many times).
 *
 * Loading mirrors the same discipline: {@link loadMacros} walks a directory's
 * direct `*.md` children (non-recursively, the slash-macro convention), splits
 * off optional YAML-ish frontmatter, derives a one-line description, and
 * returns {@link Macro}s tagged with their {@link MacroOrigin}.
 */
import type { Macro, MacroOrigin, MacroScope, MacroToken } from "./contract";
/** Install (or clear) the legacy-syntax reporter; used by hosts for warnings. */
export declare function setLegacyMacroReporter(fn: ((kind: string, source: string) => void) | undefined): void;
/**
 * Scan a macro body into a flat {@link MacroToken} stream in a single
 * left-to-right pass.
 *
 * The scanner accumulates ordinary characters into a pending literal run and
 * flushes that run whenever it recognises a placeholder. Placeholders use the
 * indus `{{arg.…}}` form by default and the compatibility `$arg` form via the
 * shim; see the module JSDoc for the full grammar.
 *
 * Any apparent placeholder that fails to parse (e.g. `${foo}`, a dangling `$`
 * at end of input, or a stray `{{` that does not open `{{arg.`) is treated as
 * literal text so the body survives untouched. The returned stream merges
 * adjacent literal characters into a single token.
 *
 * @param body the macro body text to tokenize
 * @returns the ordered token stream; resolve it with {@link applyMacros}
 */
export declare function scanMacroBody(body: string): MacroToken[];
/**
 * Build the argument environment a macro body resolves against from the raw
 * text that followed the command name.
 *
 * `raw` is kept verbatim; `args` is the whitespace-split positional vector;
 * `all` is the positionals re-joined with single spaces (the `{{arg.all}}`
 * expansion). The split is quote-aware: single- or double-quoted runs become
 * one argument with their surrounding quotes removed, so
 * `deploy "the staging box"` yields two args.
 *
 * @param raw the verbatim argument text following the command name
 * @returns a {@link MacroScope} ready for {@link applyMacros}
 */
export declare function buildMacroScope(raw: string): MacroScope;
/**
 * Resolve a token stream against a {@link MacroScope} and concatenate to the
 * expanded text.
 *
 * Each token contributes its resolved text:
 *
 *   - `literal`    → its verbatim run.
 *   - `positional` → the matching `args[index - 1]`, or empty when out of range.
 *   - `all`        → the full `scope.all` string.
 *   - `slice`      → `args` from the 1-based `start` for up to `length`,
 *     re-joined with single spaces; out-of-range or zero-length slices yield
 *     empty.
 *
 * Because resolution happens after the single scan, expanded argument text is
 * inserted as-is and is never re-scanned for further placeholders.
 *
 * @param tokens a stream from {@link scanMacroBody}
 * @param scope  the argument environment to resolve against
 * @returns the fully expanded macro text
 */
export declare function resolveTokens(tokens: readonly MacroToken[], scope: MacroScope): string;
/**
 * Expand a macro body against a raw argument line in one shot: scan, then
 * resolve.
 *
 * Convenience over {@link scanMacroBody} + {@link buildMacroScope} +
 * {@link resolveTokens} for callers that do not retain the token stream.
 *
 * @param body the macro body containing indus or legacy placeholders
 * @param raw  the verbatim argument text following the command name
 * @returns the expanded text
 */
export declare function applyMacros(body: string, raw: string): string;
/**
 * Expand an invocation line of the form `/<name> rest…` against a set of
 * loaded macros.
 *
 * If the line opens with `/` and names a known macro, the macro's body is
 * expanded against the remainder of the line. Otherwise the line is returned
 * unchanged — ordinary user turns pass straight through.
 *
 * @param line   the raw input line
 * @param macros the macros to resolve against (later entries do not override
 *               earlier ones; the first match by name wins)
 * @returns the expanded text, or the original line when no macro matches
 */
export declare function expandInvocation(line: string, macros: readonly Macro[]): string;
/** Options for {@link loadMacros}. */
export interface LoadMacrosOptions {
    /** Where the directory's macros are tagged as having come from. */
    readonly origin?: MacroOrigin;
    /** A label for the source, woven into derived descriptions (e.g. `"project"`). */
    readonly label?: string;
}
/**
 * Load the macros defined by the direct `*.md` children of a directory.
 *
 * Non-recursive by design: slash macros live as flat files in their root, unlike
 * skills which nest. A missing directory yields an empty list (a perfectly normal
 * "no user macros configured" case); a present-but-unreadable file raises a
 * `macro_invalid` {@link briefingFault} via {@link readMacroFile}.
 *
 * @param dir  the directory to scan for `*.md` macro files
 * @param opts origin tag and source label for the produced macros
 * @returns the loaded macros, in directory order, deduped by name (first wins)
 */
export declare function loadMacros(dir: string, opts?: LoadMacrosOptions): Macro[];
/**
 * Read and parse a single macro file into a {@link Macro}.
 *
 * The macro `name` is the file's basename without its `.md` suffix. Optional
 * leading frontmatter (a `---` fenced block) supplies a `description`; absent
 * that, a description is derived from the first non-blank body line, capped and
 * suffixed with the source `label`.
 *
 * @param path   absolute path of the macro file
 * @param origin origin tag to stamp on the macro
 * @param label  source label used when deriving a description
 * @returns the parsed macro
 * @throws a `macro_invalid` {@link briefingFault} when the file cannot be read
 */
export declare function readMacroFile(path: string, origin: MacroOrigin, label: string): Macro;
/** A parsed frontmatter block plus the body that followed it. */
export interface FrontmatterSplit {
    /** Flat key/value pairs read from the leading `---` block (empty when absent). */
    readonly frontmatter: Record<string, unknown>;
    /** The document body after the closing fence (or the whole text when absent). */
    readonly body: string;
}
/**
 * Split a leading `---`-fenced frontmatter block off a markdown document.
 *
 * Recognises a block only when the very first line is exactly `---` and a later
 * line is exactly `---`. Inside, each `key: value` line becomes a flat string
 * entry (a small subset of YAML — enough for the `name`/`description`/`license`
 * keys these documents carry). When no well-formed block leads the text, the
 * frontmatter is empty and the body is the whole input.
 *
 * @param text the raw document text
 * @returns the parsed `{ frontmatter, body }`
 */
export declare function splitFrontmatter(text: string): FrontmatterSplit;
