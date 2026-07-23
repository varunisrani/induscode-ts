// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Slash line resolution — parse a typed line, then match it against the registry.
 *
 * This module is the pure front half of the slash subsystem: it takes the raw
 * string a user typed into the composer and decides three things, in order:
 *
 *   1. **Is this a slash line at all?** A line is a slash invocation only when its
 *      first non-blank character is `/` and what follows is a command-shaped
 *      token (so a bare `/` or a `/path/to/file` literal is *not* hijacked as a
 *      command). {@link parseSlash} reports this without consulting the registry.
 *   2. **Which command does the token resolve to?** {@link resolveSlash} folds a
 *      {@link SlashRegistry} in: it splits the line into a name and a trailing
 *      argument string, then resolves the name (and its aliases) through the
 *      registry's index. Resolution is case-insensitive on the command token.
 *   3. **What should the dispatcher do?** The result is a discriminated
 *      {@link SlashResolution}: `not-slash` (treat as a normal prompt / bash
 *      escape), `match` (run this command with these args), or `miss` (it looked
 *      like a command but no row owns the token — fall through to templates,
 *      plugin commands, or a literal prompt).
 *
 * Nothing here touches React, the conductor, or I/O — the whole module is a pair
 * of pure functions over a string and a registry, which is exactly why the slash
 * parsing/matching logic lives here rather than inside a `useInput` handler. The
 * effectful half (actually calling a command's `run`) is the dispatcher's job.
 */
import type { SlashCommand, SlashRegistry } from "../contract";
/**
 * The leading character that marks a line as a slash invocation.
 *
 * A single constant so the prefix is defined in exactly one place and the tests
 * assert against the same literal the parser reads.
 */
export declare const SLASH_PREFIX: "/";
/**
 * The lexical split of a slash line into its command token and argument tail.
 *
 * Produced by {@link parseSlash} before the registry is consulted, so the two
 * concerns — "did the user type a command-shaped line" and "does a command own
 * that token" — stay separable. `name` is the bare token with no leading slash
 * and folded to lower case for case-insensitive matching; `args` is everything
 * after the first run of whitespace, with the single separating space removed
 * but interior spacing preserved.
 */
export interface SlashLine {
    /** The command token, lower-cased, without the leading slash. */
    readonly name: string;
    /** The trailing argument string (may be empty), interior spacing preserved. */
    readonly args: string;
}
/**
 * Whether a typed line is shaped like a slash command at all.
 *
 * A line qualifies only when, after trimming leading blanks, it begins with the
 * {@link SLASH_PREFIX} *and* what follows up to the first whitespace is a clean
 * {@link COMMAND_TOKEN}. This deliberately rejects a lone `/`, a `//comment`, and
 * a `/usr/local/bin` style path (whose embedded slash breaks the token shape) so
 * those reach the prompt untouched.
 *
 * @param input the raw composer line
 */
export declare function looksLikeSlash(input: string): boolean;
/**
 * Split a slash line into its {@link SlashLine} token/argument pair, or
 * `undefined` when the line is not shaped like a command.
 *
 * The token runs from just after the slash up to the first whitespace (or
 * end-of-line); the argument tail is whatever follows that whitespace, trimmed
 * only at its outer edges. The token is lower-cased so resolution can be
 * case-insensitive without the caller pre-normalising.
 *
 * @param input the raw composer line
 */
export declare function parseSlash(input: string): SlashLine | undefined;
/**
 * The outcome of resolving a typed line against a {@link SlashRegistry}.
 *
 *   - `not-slash` — the line is not a command invocation; the dispatcher should
 *     hand it on as a normal prompt (or a `!`/`!!` bash escape).
 *   - `match`     — the token resolved to `command`; run it with `args` (the raw
 *     trailing string) via a {@link import("../contract").SlashContext}.
 *   - `miss`      — the line *was* command-shaped but no row owns the token; the
 *     dispatcher falls through to templates / plugin commands / a literal prompt.
 *     The offending `name` is reported so a caller can surface "unknown command".
 */
export type SlashResolution = {
    readonly kind: "not-slash";
} | {
    readonly kind: "match";
    readonly command: SlashCommand;
    readonly args: string;
} | {
    readonly kind: "miss";
    readonly name: string;
};
/**
 * Resolve a raw composer line against the registry to a {@link SlashResolution}.
 *
 * Parses the line ({@link parseSlash}); a non-command line resolves to
 * `not-slash`. A command-shaped line's token is looked up in the registry index
 * (which already carries both canonical names and aliases), yielding `match`
 * with the owning command and the raw argument string, or `miss` when no row
 * claims the token.
 *
 * This is the single entry point a dispatcher calls; it performs no effects.
 *
 * @param input    the raw composer line
 * @param registry the registry to resolve against
 */
export declare function resolveSlash(input: string, registry: SlashRegistry): SlashResolution;
