// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Bash command parser/classifier + catastrophic-command blocklist.
 *
 * The permission engine ({@link "./permissions"}) matches a tool call against
 * induscode-style `Bash(...)` allow/ask/deny rules. For most tools the call is a
 * single atomic action, so a rule's argument specifier matches against one
 * subject string. The shell tool is different: `a && b; c | d` is FOUR commands
 * in one call, and a coarse "match the whole command string" check is trivially
 * bypassed — a benign-looking prefix can smuggle a destructive tail past an
 * allow rule (`npm test && rm -rf /`), or hide a blocked binary behind a wrapper
 * (`env X=1 rm -rf /`, `sudo rm -rf /`) or quoting.
 *
 * This module makes bash matching real. It is split in two concerns:
 *
 *   1. **A parser/classifier** — {@link parseBashCommand} splits a shell command
 *      string into its constituent *simple* commands across the control
 *      operators (`;`, `&&`, `||`, `|`, newlines) and `( … )` subshells /
 *      `$( … )` / `` ` … ` `` command substitutions, strips benign leading
 *      wrappers (`env VAR=x`, `nice`, `nohup`, `timeout N`, `xargs`, `command`,
 *      `builtin`, and `sudo`/`doas` — the last recorded as an *elevation* flag),
 *      and returns each base command + its raw argument string. Quoting is
 *      handled well enough that `"rm -rf /"` cannot hide behind quotes or a
 *      wrapper. The split is quote-aware so an operator *inside* a quoted string
 *      (`echo "a && b"`) is NOT treated as a command boundary.
 *
 *   2. **A catastrophic blocklist** — {@link isCatastrophicCommand} matches a
 *      single parsed sub-command against a conservative set of always-deny
 *      patterns (root-targeting `rm -rf`, fork bombs, `curl … | sh` of remote
 *      scripts, `dd of=/dev/…`, `mkfs`, `chmod -R 777 /`, redirect-to-raw-disk).
 *      It is deliberately narrow so normal dev commands (`rm -rf node_modules`,
 *      `rm -rf ./dist`, `curl … -o file`) are NOT blocked. This is
 *      defense-in-depth, NOT a hard security boundary — the OS sandbox and the
 *      permission gate are the real boundary.
 *
 * Everything here is pure, synchronous, and side-effect free so the classifier
 * and the blocklist are exhaustively unit-testable, and the permission engine
 * can fold them into its decision without any I/O.
 */
/**
 * One simple command extracted from a (possibly compound) shell string.
 *
 * `rm -rf /tmp` parses to `{ name: "rm", args: ["-rf", "/tmp"], elevated: false,
 * raw: "rm -rf /tmp" }`. The `name` is the base binary AFTER benign wrappers are
 * stripped; `args` are its tokens (quotes removed); `raw` is the original
 * sub-command slice (wrappers included) so a caller can echo exactly what the
 * model asked for; `elevated` is true when a `sudo`/`doas` wrapper was stripped.
 */
export interface ParsedCommand {
    /** The base binary, lower-cased for stable comparison (e.g. `"rm"`). */
    readonly name: string;
    /** The argument tokens after the binary, with surrounding quotes removed. */
    readonly args: readonly string[];
    /** Whether a `sudo`/`doas` elevation wrapper preceded this command. */
    readonly elevated: boolean;
    /** The original sub-command slice (wrappers included), trimmed. */
    readonly raw: string;
}
/**
 * Parse a (possibly compound) shell command string into the flat list of every
 * simple command it runs — across operators, subshells, and command
 * substitutions, with benign wrappers stripped.
 *
 * The result is order-preserving and exhaustive enough that the permission
 * engine can evaluate a `Bash(...)` rule (and the catastrophic blocklist)
 * against EACH sub-command independently: a deny on any sub-command denies the
 * whole call, and an allow must cover every sub-command to auto-allow.
 *
 * @returns one {@link ParsedCommand} per simple command; an empty array for an
 * empty/whitespace command string.
 */
export declare function parseBashCommand(command: string): ParsedCommand[];
/**
 * Classify a SINGLE parsed sub-command against the catastrophic blocklist.
 *
 * @returns the byte-stable deny reason when the command is catastrophic, else
 * `undefined`. Use {@link evaluateCatastrophic} for a whole compound call (it
 * also runs the cross-sub-command `curl | sh` correlation).
 */
export declare function catastrophicReason(cmd: ParsedCommand): string | undefined;
/** Convenience boolean form of {@link catastrophicReason}. */
export declare function isCatastrophicCommand(cmd: ParsedCommand): boolean;
/**
 * Evaluate the catastrophic blocklist over a WHOLE bash command string.
 *
 * Parses the (possibly compound) command, runs the per-sub-command blocklist on
 * each leaf, AND runs the cross-sub-command `curl | sh` correlation. Returns a
 * byte-stable deny message when ANY check fires, else `undefined`.
 *
 * This is what the permission engine calls for the bash tool: a catastrophic
 * command is denied REGARDLESS of allow/ask/deny rules or mode (it is not even
 * `bypass`-able, mirroring the original always-block guard).
 */
export declare function evaluateCatastrophic(command: string): string | undefined;
/**
 * Render the rule-matching SUBJECT for each sub-command of a bash call: the base
 * command joined with its argument tokens (wrappers stripped). The permission
 * engine matches an induscode `Bash(...)` specifier against EACH of these — an
 * allow rule must cover them all to auto-allow, a deny on any one denies the
 * whole call.
 *
 * For `npm test && rm important.txt` this yields `["npm test", "rm
 * important.txt"]`, so `Bash(npm test)` allows the first but not the second.
 * Returns the original command (single element) when nothing parses, so a tool
 * call always has at least one subject to match against.
 */
export declare function bashSubcommandSubjects(command: string): string[];
