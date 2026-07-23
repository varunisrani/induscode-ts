// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Shell kit — POSIX shell-argument quoting and command assembly.
 *
 * A leaf utility for safely turning argument strings into a single shell line.
 * The agent shells out to provisioned binaries (fd / rg) and to user commands;
 * any argument carrying a space, a glob, a quote, or a metacharacter must be
 * quoted so the shell passes it through as one literal token rather than
 * re-parsing it.
 *
 * The strategy is the conventional POSIX one: wrap the argument in single
 * quotes and escape any embedded single quote by closing the quote, emitting an
 * escaped quote, and reopening — `it's` becomes `'it'\''s'`. Inside single
 * quotes the shell treats every other character literally, so this is robust
 * against spaces, `$`, backticks, `*`, `;`, newlines, and the rest. Arguments
 * that contain only safe characters are passed through unquoted to keep the
 * rendered line readable.
 *
 * Pure and framework-agnostic: no process spawn, no environment, no I/O.
 */
/**
 * Quote a single argument for a POSIX shell.
 *
 * Returns the argument unchanged when it is non-empty and made up entirely of
 * shell-safe characters; otherwise wraps it in single quotes, escaping embedded
 * single quotes with the `'\''` idiom. An empty string becomes `''` so it
 * survives as a distinct (empty) argument rather than vanishing.
 *
 * @param arg the raw argument value to quote
 */
export declare function quoteArg(arg: string): string;
/**
 * Whether an argument would need quoting on a POSIX shell line.
 *
 * `true` when the value is empty or contains any character outside the
 * shell-safe class. Useful for diagnostics or for deciding whether to render a
 * command differently; {@link quoteArg} applies the same test internally.
 *
 * @param arg the raw argument value to test
 */
export declare function needsQuoting(arg: string): boolean;
/**
 * Assemble a list of arguments into a single space-separated shell line.
 *
 * Each element is run through {@link quoteArg}, so the result is safe to hand to
 * a shell as one command string. The argument order is preserved; an empty list
 * yields an empty string.
 *
 * @param args the command and its arguments, in invocation order
 */
export declare function buildShellCommand(args: readonly string[]): string;
