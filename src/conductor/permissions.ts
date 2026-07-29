/**
 * Permission rule engine + the `canUseTool` gate seam.
 *
 * This module is the product-side brain of the permission stack. It is split in
 * two layers:
 *
 *   1. **A pure rule engine** — {@link resolveRuleDecision} maps a single tool
 *      call `(toolName, input, mode, rules)` to a {@link PermissionBehavior}
 *      (`allow` / `ask` / `deny`). It is total, synchronous, and side-effect free
 *      so the precedence (deny > ask > mode auto-allow > allow) is exhaustively
 *      unit-testable. Rule strings are induscode-style: a bare tool name
 *      (`"Bash"`) or a tool name with an argument specifier
 *      (`"Bash(npm run test:*)"`).
 *
 *   2. **A gate factory** — {@link createPermissionGate} turns that engine into a
 *      framework {@link CanUseToolFn}: the hard async hook the framework agent
 *      awaits immediately before every tool runs. An `ask` decision is routed to
 *      an OPTIONAL host-supplied approval resolver; when the resolver is absent
 *      (a non-interactive boot) `ask` denies with a clear message. An
 *      `allow-always` approval appends a session-scoped allow rule so later
 *      identical calls auto-allow.
 *
 * Backwards-compatibility: the framework `canUseTool` hook is itself optional, so
 * a session that never builds a gate keeps today's allow-all behavior. A gate
 * built from an empty rule set in `default` mode allows read-only tools and asks
 * for everything else — and, with no resolver, the `ask` denials are explicit
 * rather than silent.
 */

import type { PermissionMode } from "../settings.js"
import {
  bashSubcommandSubjects,
  evaluateCatastrophic,
} from "./bash-guard.js"

/** Re-exported so consumers of the engine get the mode vocabulary in one import. */
export type { PermissionMode }

/** The verdict the rule engine renders for a single tool call. */
export type PermissionBehavior = "allow" | "ask" | "deny"

/**
 * One parsed permission rule: a behavior plus the tool it targets, with an
 * optional argument specifier (`ruleContent`) that further narrows the match.
 */
export interface PermissionRule {
  /** What happens when this rule matches a tool call. */
  readonly ruleBehavior: PermissionBehavior
  /** The tool (and optional argument specifier) this rule selects. */
  readonly ruleValue: {
    /** The canonical tool name, e.g. `"Bash"` / `"bash"` (matched case-insensitively). */
    readonly toolName: string
    /** An optional argument specifier, e.g. `"npm run test:*"`. Absent = bare match. */
    readonly ruleContent?: string
  }
}

/**
 * The framework's tool-permission verdict. Mirrors `indusagi/agent`'s
 * `PermissionDecision`; re-declared here so the product engine never imports the
 * framework just for a structural type (the gate is assignable to the
 * framework's `CanUseToolFn` because the shapes coincide).
 */
export type PermissionDecision =
  | {
      behavior: "allow"
      updatedInput?: unknown
    }
  | {
      behavior: "deny"
      message: string
    }

/**
 * The hard permission gate the framework agent awaits before each tool executes.
 * Structurally identical to `indusagi/agent`'s `CanUseToolFn`, so a value of this
 * type is accepted by `new Agent({ canUseTool })` with no cast.
 */
export type CanUseToolFn = (
  toolName: string,
  input: unknown,
  opts: { signal?: AbortSignal },
) => Promise<PermissionDecision>

/**
 * The outcome of the host approval prompt raised for an `ask` decision:
 *   - `allow-once`   — run this single call, do not remember.
 *   - `allow-always` — run it and append a session allow rule for the tool.
 *   - `deny`         — block this call.
 */
export type ApprovalChoice = "allow-once" | "allow-always" | "deny"

/**
 * What an {@link ApprovalResolver} may resolve to: a user's {@link ApprovalChoice},
 * or `"unavailable"` — the conductor's stable delegate answers that when NO
 * interactive resolver is installed behind it (a headless boot, or the console not
 * yet mounted). The gate maps `"unavailable"` to the actionable "requires
 * approval" deny (pointing at `--permission-mode` / settings allow rules) rather
 * than the "denied by the user" message, which would be false when no user ever
 * saw a prompt.
 */
export type ApprovalOutcome = ApprovalChoice | "unavailable"

/**
 * The OPTIONAL host approval resolver. When present, an `ask` decision awaits it;
 * the host (an interactive overlay) returns the user's choice. It MUST resolve to
 * `"deny"` on abort so a cancelled turn never hangs on a pending prompt. When the
 * resolver is absent (non-interactive boot / oneshot / link), an `ask` decision
 * deterministically denies. A stable pass-through delegate (the conductor's)
 * resolves `"unavailable"` while no real resolver is installed behind it, so the
 * gate can surface the actionable non-interactive deny message instead of a
 * fictitious user denial.
 */
export type ApprovalResolver = (
  toolName: string,
  input: unknown,
  opts: { signal?: AbortSignal },
) => Promise<ApprovalOutcome>

/**
 * Tool names known to only inspect state (never mutate). Mirrors the framework's
 * `READ_ONLY_TOOL_NAMES`; matched case-insensitively. A tool the framework marks
 * `readOnly: true` is also auto-allowed via {@link createPermissionGate}'s
 * `readOnlyToolNames` option, so this set is the static fallback for callers that
 * only know names.
 */
export const READ_ONLY_TOOL_NAMES: ReadonlySet<string> = new Set([
  "read",
  "ls",
  "grep",
  "find",
  "glob",
  "websearch",
  "webfetch",
  "todoread",
])

/**
 * Tool names that mutate the workspace by editing or writing files. Auto-allowed
 * under `acceptEdits`, and (together with every other non-read-only tool) denied
 * under `plan`.
 */
export const EDIT_TOOL_NAMES: ReadonlySet<string> = new Set([
  "edit",
  "write",
  "multiedit",
])

function canon(toolName: string): string {
  return toolName.toLowerCase()
}

/** Whether `toolName` is a statically-known read-only tool. */
export function isReadOnlyToolName(
  toolName: string,
  extra?: ReadonlySet<string>,
): boolean {
  const name = canon(toolName)
  if (READ_ONLY_TOOL_NAMES.has(name)) return true
  if (extra) {
    for (const candidate of extra) {
      if (canon(candidate) === name) return true
    }
  }
  return false
}

/** Whether `toolName` is an edit/write tool (auto-allowed under `acceptEdits`). */
export function isEditToolName(toolName: string): boolean {
  return EDIT_TOOL_NAMES.has(canon(toolName))
}

function normalizeMode(mode: PermissionMode): PermissionMode {
  return mode === "bypassPermissions" ? "bypass" : mode
}

/**
 * Parse an induscode-style rule string into its tool name and optional argument
 * specifier.
 *
 *   - `"Bash"`                 → `{ toolName: "Bash" }`
 *   - `"Bash(npm run test:*)"` → `{ toolName: "Bash", ruleContent: "npm run test:*" }`
 *   - `"mcp__server"`          → `{ toolName: "mcp__server" }`
 *
 * Whitespace around the tool name is trimmed; an empty argument specifier
 * (`"Bash()"`) is treated as a bare rule.
 */
export function parseRule(raw: string): {
  toolName: string
  ruleContent?: string
} {
  const trimmed = raw.trim()
  const open = trimmed.indexOf("(")
  if (open === -1 || !trimmed.endsWith(")")) {
    return { toolName: trimmed }
  }
  const toolName = trimmed.slice(0, open).trim()
  const ruleContent = trimmed.slice(open + 1, trimmed.length - 1).trim()
  return ruleContent.length > 0 ? { toolName, ruleContent } : { toolName }
}

/**
 * Build a {@link PermissionRule} from a behavior and an induscode-style rule
 * string. The single place a raw settings list entry becomes a typed rule.
 */
export function makeRule(
  ruleBehavior: PermissionBehavior,
  raw: string,
): PermissionRule {
  return { ruleBehavior, ruleValue: parseRule(raw) }
}

function ruleSubject(toolName: string, input: unknown): string {
  if (input === null || typeof input !== "object") {
    return typeof input === "string" ? input : ""
  }
  const bag = input as Record<string, unknown>
  const name = canon(toolName)
  if ((name === "bash" || name === "shell") && typeof bag.command === "string") {
    return bag.command
  }
  if (typeof bag.command === "string") return bag.command
  try {
    return JSON.stringify(bag)
  } catch {
    return ""
  }
}

function specifierMatches(specifier: string, subject: string): boolean {
  if (specifier.endsWith(":*")) {
    return subject.startsWith(specifier.slice(0, -2))
  }
  if (specifier.endsWith("*") && !specifier.slice(0, -1).includes("*")) {
    return subject.startsWith(specifier.slice(0, -1))
  }
  if (specifier.includes("*")) {
    const escaped = specifier
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
    return new RegExp(`^${escaped}$`).test(subject)
  }
  return specifier === subject
}

function isBashTool(toolName: string): boolean {
  const name = canon(toolName)
  return name === "bash" || name === "shell"
}

function bashSubjects(toolName: string, input: unknown): string[] {
  const command = ruleSubject(toolName, input)
  if (command.length === 0) return []
  return bashSubcommandSubjects(command)
}

/**
 * Whether a tool call matches a rule (the ANY-match semantics used for deny/ask).
 *
 * The tool name must match (case-insensitive), with an `mcp__server` rule also
 * matching every `mcp__server__tool` under it (the induscode MCP-wildcard
 * convention). A bare rule (no specifier) matches any arguments.
 *
 * When the rule carries an argument specifier:
 *   - for the **shell** tool the command is split into its constituent
 *     sub-commands and the specifier is tested against EACH — a match on ANY
 *     sub-command counts (so `Bash(rm:*)` denies `git status && rm x`);
 *   - for any other tool the specifier is tested against the single rendered
 *     subject (the command field, or a JSON encoding).
 *
 * The any-match semantics are correct for `deny` and `ask` (a single offending
 * sub-command should trigger them). The `allow` branch needs ALL sub-commands
 * covered instead — see {@link bashAllowCoversAll}.
 */
export function toolMatchesRule(
  toolName: string,
  input: unknown,
  rule: PermissionRule,
): boolean {
  const ruleName = canon(rule.ruleValue.toolName)
  const callName = canon(toolName)
  const nameMatches =
    ruleName === callName ||
    (ruleName.startsWith("mcp__") && callName.startsWith(`${ruleName}__`))
  if (!nameMatches) return false
  const specifier = rule.ruleValue.ruleContent
  if (specifier === void 0) return true
  if (isBashTool(toolName)) {
    const subjects = bashSubjects(toolName, input)
    if (subjects.length === 0)
      return specifierMatches(specifier, ruleSubject(toolName, input))
    return subjects.some((subject) => specifierMatches(specifier, subject))
  }
  return specifierMatches(specifier, ruleSubject(toolName, input))
}

function bashAllowSetCoversAll(
  toolName: string,
  input: unknown,
  allowRules: readonly PermissionRule[],
): boolean {
  const callName = canon(toolName)
  const subjects = bashSubjects(toolName, input)
  if (subjects.length === 0) return false
  return subjects.every((subject) =>
    allowRules.some((rule) => {
      if (canon(rule.ruleValue.toolName) !== callName) return false
      const specifier = rule.ruleValue.ruleContent
      if (specifier === void 0) return true
      return specifierMatches(specifier, subject)
    }),
  )
}

/**
 * Resolve the behavior for a single tool call against the rule set and mode.
 *
 * Precedence, highest first:
 *   1. **deny rules** — any matching `deny` rule blocks, regardless of mode. Deny
 *      wins across every tier (the caller concatenates the tiers before passing
 *      the list in, and this scans all deny rules first).
 *   2. **plan mode** — denies any mutating (non-read-only) tool outright.
 *   3. **ask rules** — a matching `ask` rule forces a prompt (unless a deny
 *      already fired). Mode auto-allow does NOT override an explicit ask.
 *   4. **bypass mode** — allows everything not already denied/asked.
 *   5. **read-only auto-allow** — a known read-only tool allows in any mode.
 *   6. **acceptEdits mode** — auto-allows edit/write tools.
 *   7. **allow rules** — a matching `allow` rule (or, for the shell tool, the
 *      allow rule SET) allows.
 *   8. **fallthrough** — `ask` (the safe default: prompt, then deny when no
 *      resolver is wired).
 *
 * The catastrophic-command blocklist sits ABOVE all of this (step 0): a shell
 * command on the built-in blocklist (`rm -rf /`, fork bombs, `curl | sh`, …) is
 * denied regardless of rules or mode — even `bypass` cannot run it. See
 * {@link evaluateCatastrophic}.
 *
 * Shell handling threads through the per-sub-command matching: a compound
 * command (`a && b; c | d`) is split into its constituent commands and each rule
 * is evaluated against each — a deny/ask on ANY sub-command fires, while
 * auto-allow requires the allow rule set to cover EVERY sub-command.
 *
 * Pure and total: no I/O, no async, deterministic for a given input.
 */
export function resolveRuleDecision(
  toolName: string,
  input: unknown,
  rules: readonly PermissionRule[],
  mode: PermissionMode,
  readOnlyExtra?: ReadonlySet<string>,
): PermissionBehavior {
  const m = normalizeMode(mode)
  if (isBashTool(toolName)) {
    const command = ruleSubject(toolName, input)
    if (command.length > 0 && evaluateCatastrophic(command) !== void 0) {
      return "deny"
    }
  }
  for (const rule of rules) {
    if (rule.ruleBehavior === "deny" && toolMatchesRule(toolName, input, rule)) {
      return "deny"
    }
  }
  const readOnly = isReadOnlyToolName(toolName, readOnlyExtra)
  if (m === "plan" && !readOnly) {
    return "deny"
  }
  for (const rule of rules) {
    if (rule.ruleBehavior === "ask" && toolMatchesRule(toolName, input, rule)) {
      return "ask"
    }
  }
  if (m === "bypass") {
    return "allow"
  }
  if (readOnly) {
    return "allow"
  }
  if (m === "acceptEdits" && isEditToolName(toolName)) {
    return "allow"
  }
  if (isBashTool(toolName)) {
    const allowRules = rules.filter((r) => r.ruleBehavior === "allow")
    if (
      allowRules.length > 0 &&
      bashAllowSetCoversAll(toolName, input, allowRules)
    ) {
      return "allow"
    }
  } else {
    for (const rule of rules) {
      if (rule.ruleBehavior === "allow" && toolMatchesRule(toolName, input, rule)) {
        return "allow"
      }
    }
  }
  return "ask"
}

/**
 * The rule strings an `allow-always` approval mints — i.e. what the session will
 * REMEMBER for this tool call.
 *
 * For the shell tool the remembered rules are scoped to the command: one
 * `Bash(<sub-command>)` rule per constituent sub-command (so approving
 * `git status && npm test` remembers both halves, and re-running either — or the
 * same compound — auto-allows), but approving one command never whitelists the
 * whole shell. Every other tool remembers the bare tool name (`Edit`), matching
 * the prompt's "remember the tool for this session" copy.
 *
 * Exported so the approval overlay can show the user exactly what "Allow always"
 * will remember (the `suggestions` line), and so the gate and the UI can never
 * disagree about it.
 */
export function allowAlwaysRuleStrings(
  toolName: string,
  input: unknown,
): string[] {
  if (isBashTool(toolName)) {
    const bag = input as Record<string, unknown> | null
    const command =
      typeof input === "string"
        ? input
        : bag !== null &&
            typeof bag === "object" &&
            typeof bag.command === "string"
          ? bag.command
          : ""
    if (command.length > 0) {
      return bashSubcommandSubjects(command).map(
        (subject: string) => `${toolName}(${subject})`,
      )
    }
  }
  return [toolName]
}

function noResolverMessage(toolName: string): string {
  return `Tool "${toolName}" requires approval, but no interactive approval prompt is available here (a non-interactive run, or a sub-agent). Denying. Add an allow rule under permissions.allow in settings, or run with --permission-mode acceptEdits/bypass, to permit it.`
}

function declinedMessage(toolName: string): string {
  return `Tool "${toolName}" was denied by the user.`
}

function blockedMessage(toolName: string): string {
  return `Tool "${toolName}" is blocked by the active permission policy.`
}

/** Configuration for {@link createPermissionGate}. */
export interface PermissionGateConfig {
  /**
   * The ordered rule set, already concatenated across the project/global tiers.
   * Deny rules are scanned first so a deny anywhere in the list wins.
   */
  readonly rules: readonly PermissionRule[]
  /** A live getter for the current permission mode (so a mode switch is honored). */
  readonly mode: () => PermissionMode
  /**
   * The OPTIONAL host approval resolver consulted on an `ask` decision. Absent on
   * a non-interactive boot — then `ask` deterministically denies.
   */
  readonly requestApproval?: ApprovalResolver
  /**
   * Append a session-scoped allow rule when the host returns `allow-always`. The
   * boot layer owns the mutable rule list (the SAME array instance `rules` refers
   * to) and passes a push here, so the appended rule is visible to every
   * subsequent gate consultation within the session — and to every other gate
   * built over the same list (sub-agent gates included). Session-scoped only:
   * the rule is never persisted to settings.
   */
  readonly appendAllowRule?: (rule: PermissionRule) => void
  /**
   * Tool names (beyond {@link READ_ONLY_TOOL_NAMES}) to treat as read-only —
   * derived from the deck's `readOnly: true` tool flags so MCP/custom read-only
   * tools also auto-allow.
   */
  readonly readOnlyToolNames?: ReadonlySet<string>
}

/**
 * Build a framework {@link CanUseToolFn} from the rule engine + the current mode.
 *
 * The returned gate:
 *   - resolves the behavior via {@link resolveRuleDecision},
 *   - on `allow` proceeds (the framework keeps the validated args),
 *   - on `deny` short-circuits with a clear message (the framework turns it into
 *     an `isError` tool result so the model sees why),
 *   - on `ask` awaits {@link PermissionGateConfig.requestApproval} when present —
 *     `allow-once` proceeds, `allow-always` proceeds and appends a session allow
 *     rule, `deny` blocks — and DENIES when no resolver is wired (the safe
 *     non-interactive default).
 *
 * The result is assignable to `indusagi/agent`'s `CanUseToolFn`.
 */
export function createPermissionGate(
  config: PermissionGateConfig,
): CanUseToolFn {
  return async (toolName, input, opts) => {
    if (isBashTool(toolName)) {
      const command = ruleSubject(toolName, input)
      if (command.length > 0) {
        const reason = evaluateCatastrophic(command)
        if (reason !== void 0) {
          return { behavior: "deny", message: reason }
        }
      }
    }
    const behavior = resolveRuleDecision(
      toolName,
      input,
      config.rules,
      config.mode(),
      config.readOnlyToolNames,
    )
    if (behavior === "allow") {
      return { behavior: "allow" }
    }
    if (behavior === "deny") {
      return { behavior: "deny", message: blockedMessage(toolName) }
    }
    const resolver = config.requestApproval
    if (resolver === void 0) {
      return { behavior: "deny", message: noResolverMessage(toolName) }
    }
    let choice: ApprovalOutcome
    try {
      choice = await resolver(toolName, input, opts)
    } catch {
      choice = "deny"
    }
    if (choice === "allow-once" || choice === "allow-always") {
      if (choice === "allow-always" && config.appendAllowRule) {
        for (const raw of allowAlwaysRuleStrings(toolName, input)) {
          config.appendAllowRule(makeRule("allow", raw))
        }
      }
      return { behavior: "allow" }
    }
    if (choice === "unavailable") {
      return { behavior: "deny", message: noResolverMessage(toolName) }
    }
    return { behavior: "deny", message: declinedMessage(toolName) }
  }
}

/**
 * The policy bundle a parent session hands to a sub-agent runner. The sub-agent
 * gate is constructed from these fields; see {@link createSubagentPermissionGate}.
 */
export interface SessionPermissionPolicy {
  readonly rules: readonly PermissionRule[]
  readonly mode: () => PermissionMode
  readonly requestApproval?: ApprovalResolver
}

/**
 * Build a sub-agent-scoped permission gate from the parent's policy bundle.
 *
 * The returned {@link CanUseToolFn} delegates to {@link createPermissionGate}
 * using the parent's rules and live mode getter. Tool names not present in
 * `tools` are denied — a sub-agent can only act with the tool surface it was
 * given. This prevents a delegate from invoking capabilities outside its
 * intended scope.
 *
 * @param policy the parent's permission policy (rules + mode getter)
 * @param tools the tools the sub-agent has been granted access to
 */
export function createSubagentPermissionGate(
  policy: SessionPermissionPolicy,
  tools: readonly { name: string }[],
): CanUseToolFn {
  const allowed = new Set<string>(tools.map((t) => t.name))
  const gate = createPermissionGate({
    rules: policy.rules,
    mode: policy.mode,
    ...policy.requestApproval !== undefined
      ? { requestApproval: policy.requestApproval }
      : {},
    readOnlyToolNames: READ_ONLY_TOOL_NAMES,
  })
  return async (toolName, input, opts) => {
    if (!allowed.has(toolName)) {
      return { behavior: "deny", message: `Sub-agent is not allowed to use tool "${toolName}".` }
    }
    return gate(toolName, input, opts)
  }
}