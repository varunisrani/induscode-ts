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
 *   2. **A catastrophic blocklist** — {@link catastrophicReason} matches a
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
  readonly name: string
  /** The argument tokens after the binary, with surrounding quotes removed. */
  readonly args: readonly string[]
  /** Whether a `sudo`/`doas` elevation wrapper preceded this command. */
  readonly elevated: boolean
  /** The original sub-command slice (wrappers included), trimmed. */
  readonly raw: string
}

const OPERATORS = ["&&", "||", ";", "|", "&", "\n"]

function splitTopLevel(command: string): string[] {
  const slices: string[] = []
  let current = ""
  let quote: string | undefined
  let i = 0
  const flush = () => {
    const trimmed = current.trim()
    if (trimmed.length > 0) slices.push(trimmed)
    current = ""
  }
  while (i < command.length) {
    const ch = command[i]
    if (ch === "\\" && quote !== "'") {
      current += ch
      if (i + 1 < command.length) {
        current += command[i + 1]
        i += 2
        continue
      }
      i += 1
      continue
    }
    if (quote !== void 0) {
      current += ch
      if (ch === quote) quote = void 0
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      current += ch
      i += 1
      continue
    }
    let matched: string | undefined
    for (const op of OPERATORS) {
      if (command.startsWith(op, i)) {
        matched = op
        break
      }
    }
    if (matched !== void 0) {
      flush()
      i += matched.length
      continue
    }
    current += ch
    i += 1
  }
  flush()
  return slices
}

function findParenClose(s: string, start: number): number {
  let depth = 1
  let quote: string | undefined
  let i = start
  while (i < s.length) {
    const ch = s[i]
    if (ch === "\\" && quote !== "'") {
      i += 2
      continue
    }
    if (quote !== void 0) {
      if (ch === quote) quote = void 0
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      i += 1
      continue
    }
    if (ch === "(" || (ch === "$" && s[i + 1] === "(")) depth += 1
    else if (ch === ")") {
      depth -= 1
      if (depth === 0) return i
    }
    i += 1
  }
  return s.length
}

function findBacktickClose(s: string, start: number): number {
  let i = start
  while (i < s.length) {
    if (s[i] === "\\") {
      i += 2
      continue
    }
    if (s[i] === "`") return i
    i += 1
  }
  return s.length
}

function extractSubshells(slice: string): { outer: string; inner: string[] } {
  const inner: string[] = []
  let outer = ""
  let quote: string | undefined
  let i = 0
  while (i < slice.length) {
    const ch = slice[i]
    if (ch === "\\" && quote !== "'") {
      outer += ch
      if (i + 1 < slice.length) {
        outer += slice[i + 1]
        i += 2
        continue
      }
      i += 1
      continue
    }
    if (quote !== void 0) {
      if (quote === '"' && ch === "`") {
        const close = findBacktickClose(slice, i + 1)
        inner.push(slice.slice(i + 1, close))
        i = close + 1
        continue
      }
      outer += ch
      if (ch === quote) quote = void 0
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      outer += ch
      i += 1
      continue
    }
    if (ch === "(" || (ch === "$" && slice[i + 1] === "(")) {
      const start = ch === "$" ? i + 2 : i + 1
      const close = findParenClose(slice, start)
      inner.push(slice.slice(start, close))
      i = close + 1
      continue
    }
    if (ch === "`") {
      const close = findBacktickClose(slice, i + 1)
      inner.push(slice.slice(i + 1, close))
      i = close + 1
      continue
    }
    outer += ch
    i += 1
  }
  return { outer: outer.trim(), inner }
}

function tokenizeArgv(slice: string): string[] {
  const tokens: string[] = []
  let current = ""
  let started = false
  let quote: string | undefined
  let i = 0
  const flush = () => {
    if (started) tokens.push(current)
    current = ""
    started = false
  }
  while (i < slice.length) {
    const ch = slice[i]
    if (ch === "\\" && quote !== "'") {
      if (i + 1 < slice.length) {
        current += slice[i + 1]
        started = true
        i += 2
        continue
      }
      i += 1
      continue
    }
    if (quote !== void 0) {
      if (ch === quote) {
        quote = void 0
      } else {
        current += ch
      }
      started = true
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      started = true
      i += 1
      continue
    }
    if (ch === " " || ch === "\t") {
      flush()
      i += 1
      continue
    }
    current += ch
    started = true
    i += 1
  }
  flush()
  return tokens
}

const WRAPPERS = new Set([
  "env",
  "nice",
  "nohup",
  "timeout",
  "xargs",
  "command",
  "builtin",
  "time",
  "stdbuf",
  "setsid",
  "ionice",
])

const ELEVATION = new Set(["sudo", "doas"])

const FLAG_TAKES_VALUE = new Set([
  "-n",
  "-u",
  "-g",
  "-s",
  "--kill-after",
  "--signal",
  "--user",
])

function consumeWrapperOptions(rest: string[], wrapper: string): void {
  for (;;) {
    const head = rest[0]
    if (head === void 0) return
    if (head === "--") {
      rest.shift()
      return
    }
    if (head.startsWith("-")) {
      rest.shift()
      if (!head.includes("=") && FLAG_TAKES_VALUE.has(head)) {
        const value = rest[0]
        if (value !== void 0 && !value.startsWith("-")) rest.shift()
      }
      continue
    }
    if ((wrapper === "timeout" || wrapper === "nice") && /^\d+[a-z]?$/i.test(head)) {
      rest.shift()
      continue
    }
    return
  }
}

function stripWrappers(argv: string[]): { rest: string[]; elevated: boolean } {
  const rest = [...argv]
  let elevated = false
  for (;;) {
    const head = rest[0]
    if (head === void 0) break
    const token = head.toLowerCase()
    if (ELEVATION.has(token)) {
      rest.shift()
      elevated = true
      consumeWrapperOptions(rest, token)
      continue
    }
    if (WRAPPERS.has(token)) {
      rest.shift()
      consumeWrapperOptions(rest, token)
      continue
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(head)) {
      rest.shift()
      continue
    }
    break
  }
  return { rest, elevated }
}

/** Strip wrappers/elevation prefixes from a tokenized argv (read-only variant). */
export function stripSafeWrappers(argv: readonly string[]): { rest: string[]; elevated: boolean } {
  return stripWrappers([...argv])
}

/**
 * Strip every leading `NAME=value` environment assignment from a token list,
 * leaving the actual command name (and any non-env-prefix tokens) untouched.
 */
export function stripAllLeadingEnvVars(argv: readonly string[]): string[] {
  const rest = [...argv]
  while (rest.length > 0 && /^[A-Za-z_][A-Za-z0-9_]*=/.test(rest[0])) {
    rest.shift()
  }
  return rest
}

function parseInto(command: string, out: ParsedCommand[]): void {
  for (const slice of splitTopLevel(command)) {
    const { outer, inner } = extractSubshells(slice)
    if (outer.length > 0) {
      const argv = tokenizeArgv(outer)
      if (argv.length > 0) {
        const { rest, elevated } = stripWrappers(argv)
        const name = rest[0]
        if (name !== void 0 && name.length > 0) {
          out.push({
            name: name.toLowerCase(),
            args: rest.slice(1),
            elevated,
            raw: slice.trim(),
          })
        }
      }
    }
    for (const body of inner) {
      if (body.trim().length > 0) parseInto(body, out)
    }
  }
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
export function parseBashCommand(command: string): ParsedCommand[] {
  if (typeof command !== "string" || command.trim().length === 0) return []
  const out: ParsedCommand[] = []
  parseInto(command, out)
  return out
}

function catastrophicMessage(reason: string): string {
  return `This command is blocked: ${reason}. It is on the built-in catastrophic-command blocklist and cannot be run regardless of permission rules.`
}

function normPath(token: string): string {
  const collapsed = token.replace(/\/+/g, "/")
  if (collapsed.length > 1 && collapsed.endsWith("/")) return collapsed.slice(0, -1)
  return collapsed
}

const ROOT_TARGETS = new Set([
  "/",
  "/*",
  "~",
  "~/",
  "$home",
  "$home/",
  "/bin",
  "/boot",
  "/dev",
  "/etc",
  "/home",
  "/lib",
  "/opt",
  "/proc",
  "/root",
  "/sbin",
  "/srv",
  "/sys",
  "/usr",
  "/var",
])

function isRootRm(cmd: ParsedCommand): boolean {
  if (cmd.name !== "rm") return false
  let recursive = false
  const targets: string[] = []
  for (const arg of cmd.args) {
    if (arg.startsWith("--")) {
      if (arg === "--recursive") recursive = true
      continue
    }
    if (arg.startsWith("-") && arg.length > 1) {
      if (arg.includes("r") || arg.includes("R")) recursive = true
      continue
    }
    targets.push(normPath(arg.toLowerCase()))
  }
  if (!recursive) return false
  return targets.some(
    (t) => ROOT_TARGETS.has(t) || t === "/.." || /^\/[a-z]+\/\*$/.test(t),
  )
}

const SHELL_SINKS = new Set(["sh", "bash", "zsh", "dash", "ksh", "fish", "csh", "tcsh"])
const FETCHERS = new Set(["curl", "wget", "fetch"])

function isRemoteScriptPipedToShell(cmd: ParsedCommand): boolean {
  if (!SHELL_SINKS.has(cmd.name)) return false
  return /\b(curl|wget|fetch)\b/i.test(cmd.raw) && /https?:\/\//i.test(cmd.raw)
}

function isRootChmod(cmd: ParsedCommand): boolean {
  if (cmd.name !== "chmod") return false
  let recursive = false
  let world = false
  const targets: string[] = []
  for (const arg of cmd.args) {
    if (arg === "-R" || arg === "--recursive" || /^-[a-z]*R/i.test(arg)) recursive = true
    else if (/^[0-7]?777$/.test(arg) || arg.includes("o+w") || arg.includes("a+w")) world = true
    else if (!arg.startsWith("-")) targets.push(normPath(arg.toLowerCase()))
  }
  return recursive && world && targets.some((t) => ROOT_TARGETS.has(t))
}

interface CatastrophicRule {
  reason: string
  test: (cmd: ParsedCommand) => boolean
}

const FORK_BOMB = /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/;

const CATASTROPHIC_RULES: CatastrophicRule[] = [
  {
    reason: "recursive force-delete of a root or system directory (rm -rf /)",
    test: isRootRm,
  },
  {
    reason: "piping a downloaded remote script straight into a shell (curl | sh)",
    test: isRemoteScriptPipedToShell,
  },
  {
    reason: "writing raw bytes to a block device (dd of=/dev/...)",
    test: (cmd) =>
      cmd.name === "dd" &&
      cmd.args.some((a) => /^of=\/dev\/(sd|nvme|disk|hd|mmcblk|vd)/i.test(a)),
  },
  {
    reason: "formatting a filesystem (mkfs)",
    test: (cmd) => /^mkfs(\.|$)/.test(cmd.name),
  },
  {
    reason: "redirecting output over a raw disk device (> /dev/sd...)",
    test: (cmd) => /[>]\s*\/dev\/(sd|nvme|disk|hd|mmcblk|vd)/i.test(cmd.raw),
  },
  {
    reason: "world-writable recursive chmod of a root or system directory (chmod -R 777 /)",
    test: isRootChmod,
  },
]

function scanForRemotePipeToShell(cmds: ParsedCommand[]): string | undefined {
  const hasRemoteFetch = cmds.some(
    (c) => FETCHERS.has(c.name) && c.args.some((a) => /^https?:\/\//i.test(a)),
  )
  if (!hasRemoteFetch) return void 0
  const hasShellSink = cmds.some(
    (c) =>
      SHELL_SINKS.has(c.name) &&
      !c.args.some((a) => !a.startsWith("-") && /\.(sh|bash)$/i.test(a)),
  )
  if (hasShellSink) {
    return "piping a downloaded remote script straight into a shell (curl | sh)"
  }
  return void 0
}

/**
 * Classify a SINGLE parsed sub-command against the catastrophic blocklist.
 *
 * @returns the byte-stable deny reason when the command is catastrophic, else
 * `undefined`. Use {@link evaluateCatastrophic} for a whole compound call (it
 * also runs the cross-sub-command `curl | sh` correlation).
 */
export function catastrophicReason(cmd: ParsedCommand): string | undefined {
  for (const rule of CATASTROPHIC_RULES) {
    if (rule.test(cmd)) return rule.reason
  }
  return void 0
}

/** Convenience boolean form of {@link catastrophicReason}. */
export function isCatastrophicCommand(cmd: ParsedCommand): boolean {
  return catastrophicReason(cmd) !== void 0
}

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
export function evaluateCatastrophic(command: string): string | undefined {
  if (FORK_BOMB.test(command)) {
    return catastrophicMessage("fork bomb")
  }
  const cmds = parseBashCommand(command)
  if (cmds.length === 0) return void 0
  for (const cmd of cmds) {
    const reason = catastrophicReason(cmd)
    if (reason !== void 0) return catastrophicMessage(reason)
  }
  const piped = scanForRemotePipeToShell(cmds)
  if (piped !== void 0) return catastrophicMessage(piped)
  return void 0
}

/**
 * For the permission engine: emit the per-sub-command subject strings (base
 * command + args, joined) used to test a `Bash(...)` rule specifier against an
 * individual call.
 */
export function commandSubcommandSubjects(command: string): string[] {
  return bashSubcommandSubjects(command)
}

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
export function bashSubcommandSubjects(command: string): string[] {
  const cmds = parseBashCommand(command)
  if (cmds.length === 0) return [command]
  return cmds.map((c) => [c.name, ...c.args].join(" ").trim())
}