// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Skill-invocation block parser — an attribute-scanning hand parser.
 *
 * The coding agent lets a turn carry a *skill invocation*: an XML-ish opener tag
 * that names a capability card to run, optionally locates its on-disk file, and
 * wraps a trailing user message (the body) the skill should act on. The shape is
 * the framework Agent-Skills convention:
 *
 *   ```
 *   <skill name="commit-helper" location="/abs/path/SKILL.md">
 *   please tidy the staged diff and write a message
 *   </skill>
 *   ```
 *
 * This module re-derives that parse from the *format spec*, deliberately NOT as
 * one monolithic capture regex. It is a small hand-written scanner: it walks the
 * input, finds the opener, scans `key=value` attributes one at a time (handling
 * single- or double-quoted and bare values, with `&amp;`/`&lt;`/`&gt;`/`&quot;`/
 * `&#39;` entity decoding), then captures the body up to the matching close tag.
 * Reading attributes incrementally — rather than matching the whole block in a
 * single pattern — is what makes this an independent implementation and lets the
 * parser keep *every* attribute the author wrote, not just a fixed `name`/
 * `location` pair.
 *
 * Block grammar (informal):
 *   block   := WS? '<' TAG WS attrs? WS? '>' body '</' TAG WS? '>'
 *   TAG     := 'skill'            (case-insensitive)
 *   attrs   := (attr WS?)*
 *   attr    := key ('=' value)?
 *   key     := [A-Za-z_][A-Za-z0-9_:.-]*
 *   value   := '"' ... '"' | '\'' ... '\'' | bare           (bare stops at WS / '>')
 *   body    := any text, captured verbatim up to the close tag
 *
 * A valid block must (a) be the leading content of the text (only leading
 * whitespace may precede the opener), (b) name the `skill` tag, (c) carry a
 * non-empty `name` attribute, and (d) be closed by `</skill>`. Anything else
 * yields `null`, signalling "this turn is ordinary text, not a skill call".
 */
/**
 * The structured result of a successful parse.
 *
 *   - `name` — the value of the required `name` attribute (the skill to run).
 *   - `args` — every attribute the opener carried, keyed by (lower-cased) name,
 *     including `name` itself and any `location`/custom keys. A bare attribute
 *     with no `=value` maps to the empty string.
 *   - `body` — the verbatim text between the opener and the `</skill>` close,
 *     with a single leading and trailing newline trimmed (the common case where
 *     the opener/closer sit on their own lines) but inner whitespace preserved.
 */
export interface SkillInvocation {
    readonly name: string;
    readonly args: Record<string, string>;
    readonly body: string;
}
/**
 * Parse a skill-invocation block out of `text`.
 *
 * Walks the string by hand: skips leading whitespace, confirms a `<skill …>`
 * opener, scans each attribute into an `args` record, captures the body up to the
 * matching `</skill>`, and decodes entities. Returns the structured invocation,
 * or `null` when the text is not a well-formed leading skill block (ordinary
 * turns simply parse to `null`).
 *
 * @param text the raw turn text that may begin with a skill block
 * @returns the parsed `{ name, args, body }`, or `null` if not a skill block
 */
export declare function parseSkillInvocation(text: string): SkillInvocation | null;
