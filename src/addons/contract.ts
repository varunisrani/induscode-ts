// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Addons contract — the FROZEN type surface of the third-party customization
 * layer.
 *
 * This module is the single typed seam between the coding-agent *product* and
 * code that does not ship with it: locally-authored TypeScript modules that
 * graft tools, slash commands, lifecycle observers, and tool-boundary
 * interceptors onto a running session. It declares *only* shapes plus a handful
 * of tiny inert helpers (a brand minter, a fault factory, and a pure
 * empty-manifest constant) — no I/O, no module loading, no dispatch. Every
 * later addons module (the jiti-backed sandbox loader, the capability registry,
 * the surface builder, the event dispatcher, and the interceptor chain) is
 * written against the names declared here, so the file is intentionally small,
 * append-mostly, and stable.
 *
 * Design stance — three deliberate divergences from the prevailing
 * "factory writes into per-addon Maps" pattern:
 *
 *   1. **Return-a-manifest registration.** An addon module's `register` is
 *      handed an {@link AddonSurface} and *records* its intent — subscriptions,
 *      interceptors, commands, tools — but the registration calls do not mutate
 *      any global runtime. The host reads the recorded {@link AddonManifest}
 *      back out and folds it into one shared registry. Registration is a pure
 *      description of capability, not a side effect on the agent.
 *
 *   2. **One unified event model.** Lifecycle observation, payload
 *      transformation, and veto are a single {@link EventDispatcher} of
 *      colon-named {@link HookEvent}s, each carrying a {@link HookHandler} of one
 *      of three middleware kinds — `observe` (fire-and-forget), `transform`
 *      (returns a replacement payload), `gate` (returns a stop decision). There
 *      is no second parallel "hooks" system; the dotted vocabulary is replaced
 *      by colon names (`tool:before`, `chat:params`, `shell:env`, …).
 *
 *   3. **A tool-boundary pipeline.** The per-tool interception path is an
 *      ordered {@link InterceptorChain} of {@link ToolInterceptor} stages with
 *      `enter`/`exit` hooks, applied as a reduce (enter forward, exit reverse) —
 *      not a nested-if tool wrapper.
 *
 * The module loader is **injectable** ({@link ModuleLoader}): the default is
 * jiti-backed (resolving TypeScript modules inside a compiled binary via
 * bundled-namespace virtual modules), but a test injects a scripted fake that
 * returns an {@link AddonManifest} with no real jiti and no disk access.
 *
 * Framework anchors (all from the `indusagi` package — the sibling rebuilt
 * framework this app targets):
 *   - `AgentTool`, `AgentToolResult`, `AgentMessage` ← `indusagi/agent`
 *   - `Model`, `ThinkingLevel`                       ← `indusagi/agent` / `indusagi/ai`
 *   - `Component`, `KeyId`                           ← `indusagi/tui`
 *   - `TSchema`, `Static`                            ← `@sinclair/typebox`
 *
 * The contract never re-declares these; it composes them.
 */
import type { AgentMessage, AgentTool, AgentToolResult, ThinkingLevel } from "indusagi/agent";
import type { Model } from "indusagi/ai";
import type { Component, KeyId } from "indusagi/tui";
import type { Static, TSchema } from "@sinclair/typebox";
/** Re-exported framework vocabulary that addon consumers routinely need. */
export type { AgentMessage, AgentTool, AgentToolResult, ThinkingLevel, Model, Component, KeyId, TSchema, Static, };
/**
 * The module specifiers an addon may import that are statically bundled into the
 * compiled binary and re-exposed to dynamically-loaded addon code.
 *
 * In a compiled single-file binary, an addon's `import "indusagi/agent"` cannot
 * resolve against `node_modules` — the framework is already inside the binary.
 * The sandbox satisfies these specifiers from in-memory namespace objects
 * (jiti's `virtualModules` option) so the addon shares the host's exact module
 * instances. In Node/dev the same specifiers resolve to real files (jiti's
 * `alias` option). The literal set is the contract; the resolution mechanism is
 * the sandbox's concern.
 */
export type BundledNamespace = "indusagi/agent" | "indusagi/ai" | "indusagi/tui" | "@sinclair/typebox";
/**
 * The frozen list of {@link BundledNamespace} specifiers, in a stable order.
 *
 * The sandbox loader maps each entry to its statically-imported namespace object
 * to build the jiti `virtualModules` / `alias` record. Declared here so the
 * loader and any introspection share one source of truth.
 */
export declare const BUNDLED_NAMESPACES: readonly BundledNamespace[];
/**
 * String-branded stable identifier for a loaded addon.
 *
 * Derived from the addon's declared `id` (or its source path when absent);
 * branded so an arbitrary string cannot be passed where a vetted addon id is
 * required. Mint one with {@link addonId}.
 */
export type AddonId = string & {
    readonly __addon: unique symbol;
};
/** Brand a raw string as an {@link AddonId}. The single sanctioned minter. */
export declare function addonId(raw: string): AddonId;
/**
 * What an addon module returns (or whose `register` the host invokes) — the
 * top-level export the {@link ModuleLoader} resolves.
 *
 * An addon is a plain object, not a class: it declares its identity and a single
 * `register` entry point. `register` receives an {@link AddonSurface} and uses
 * it to *record* the addon's contributions; the host then reads those
 * contributions back as a {@link RegisteredManifest}. The addon never reaches
 * into global agent state — its only channel is the surface it is handed.
 */
export interface AddonManifest {
    /**
     * Stable identifier for the addon. When omitted, the host derives one from the
     * source path. Used for de-duplication, error attribution, and conflict
     * diagnostics.
     */
    readonly id?: string;
    /** Optional semantic version string, surfaced in diagnostics and listings. */
    readonly version?: string;
    /**
     * The addon's single entry point.
     *
     * Invoked once at load time with a fresh {@link AddonSurface}. Synchronous or
     * async; it records subscriptions / interceptors / commands / tools onto the
     * surface and returns nothing. Throwing here is captured as an
     * {@link AddonFault} and never crashes the host.
     *
     * @param surface the registration API scoped to this addon
     */
    register(surface: AddonSurface): void | Promise<void>;
}
/**
 * The contributions an addon recorded through its {@link AddonSurface}, read
 * back by the host after `register` runs — the return value of registration,
 * not a mutation of shared state.
 *
 * This is the declarative result the host folds into its single capability
 * registry: the event subscriptions, the tool interceptors, the slash commands,
 * and the tools the addon contributed. Each entry carries enough provenance
 * ({@link AddonId}) to attribute a later failure back to its origin addon.
 */
export interface RegisteredManifest {
    /** The addon these contributions belong to. */
    readonly addon: AddonId;
    /** Optional version copied from the {@link AddonManifest}. */
    readonly version?: string;
    /** Event subscriptions the addon registered via {@link AddonSurface.on}. */
    readonly subscriptions: readonly EventSubscription[];
    /** Tool interceptors the addon registered via {@link AddonSurface.interceptTool}. */
    readonly interceptors: readonly ToolInterceptor[];
    /** Slash commands the addon registered via {@link AddonSurface.addCommand}. */
    readonly commands: readonly AddonCommand[];
    /** Tools the addon registered via {@link AddonSurface.addTool}. */
    readonly tools: readonly AddonTool[];
}
/**
 * An immutable, empty {@link RegisteredManifest} for a given addon — the seed an
 * accumulating surface starts from, and a safe value to fold for an addon that
 * registered nothing.
 *
 * @param addon the addon this empty manifest is attributed to
 * @param version optional version to carry through
 */
export declare function emptyManifest(addon: AddonId, version?: string): RegisteredManifest;
/**
 * The colon-named event vocabulary an addon can hook.
 *
 * One unified taxonomy replaces the split between broad lifecycle events and
 * low-level mutation hooks. Names are colon-segmented (`scope:phase`) rather
 * than dot-segmented, and a single event can be observed, transformed, or gated
 * depending on the {@link HookHandler.kind} an addon attaches:
 *
 *   - `session:start` / `session:end`     — a session opened / closed.
 *   - `turn:start` / `turn:end`           — an assistant turn began / settled.
 *   - `tool:before` / `tool:after`        — straddle a single tool execution.
 *   - `chat:params`                       — the model request options are being built.
 *   - `chat:message`                      — an assistant message was assembled.
 *   - `shell:env`                         — the environment for a shell action is being prepared.
 *   - `input:submit`                      — user input is entering the loop (transform/gate).
 *   - `context:build`                     — the message context is being assembled for the model.
 *   - `compact:before`                    — the transcript is about to be condensed (gate).
 */
export type HookEvent = "session:start" | "session:end" | "turn:start" | "turn:end" | "tool:before" | "tool:after" | "chat:params" | "chat:message" | "shell:env" | "input:submit" | "context:build" | "compact:build" | "compact:before";
/**
 * The three middleware kinds a {@link HookHandler} can be.
 *
 *   - `observe`   — fire-and-forget: inspect the payload, return nothing. Cannot
 *                   alter or veto; errors are isolated and never affect the flow.
 *   - `transform` — return a replacement payload that the dispatcher threads into
 *                   the next handler (and ultimately back to the agent).
 *   - `gate`      — return a {@link GateDecision}; a `{ stop: true }` short-circuits
 *                   the event (vetoing a tool call, a compaction, a switch).
 */
export type HookKind = "observe" | "transform" | "gate";
/**
 * A veto/short-circuit decision returned by a `gate` {@link HookHandler}.
 *
 * `stop: false` (or an omitted return) lets the flow continue; `stop: true`
 * halts it, with the optional `reason` surfaced to the user/logs. Replaces the
 * scattered `cancel`/`block`/`reason` result fields with one shape.
 */
export interface GateDecision {
    /** Whether to halt the gated flow. */
    readonly stop: boolean;
    /** Human-readable explanation when {@link stop} is `true`. */
    readonly reason?: string;
}
/**
 * The discriminated handler an addon attaches to a {@link HookEvent}.
 *
 * The `kind` selects the middleware contract the `run` callback must honor:
 * `observe` returns nothing, `transform` returns a (possibly new) payload of the
 * same shape, `gate` returns a {@link GateDecision}. `TPayload` is the event's
 * payload type; the dispatcher supplies it and (for `transform`) carries the
 * return value forward. All three may be async.
 */
export type HookHandler<TPayload = unknown> = {
    readonly kind: "observe";
    run(payload: TPayload): void | Promise<void>;
} | {
    readonly kind: "transform";
    run(payload: TPayload): TPayload | Promise<TPayload>;
} | {
    readonly kind: "gate";
    run(payload: TPayload): GateDecision | void | Promise<GateDecision | void>;
};
/**
 * One recorded subscription: the event an addon hooked, the handler it attached,
 * and the addon it came from.
 *
 * Produced by {@link AddonSurface.on} and collected into
 * {@link RegisteredManifest.subscriptions}. The {@link EventDispatcher} folds all
 * subscriptions for an event into an ordered middleware run.
 */
export interface EventSubscription {
    /** The event this subscription is bound to. */
    readonly event: HookEvent;
    /** The middleware handler invoked when the event fires. */
    readonly handler: HookHandler;
    /** The addon that registered this subscription, for error attribution. */
    readonly addon: AddonId;
}
/**
 * The fan-out / transform / veto engine that runs an event's
 * {@link EventSubscription}s in order.
 *
 * Unifies what were previously separate "emit events" and "trigger hooks"
 * systems into one surface. Dispatching an event threads its payload through
 * every matching handler: `observe` handlers see it untouched, `transform`
 * handlers replace it, and a `gate` handler can stop the chain. Errors from any
 * handler are isolated into an {@link AddonFault} routed to listeners — never
 * propagated into the agent loop.
 */
export interface EventDispatcher {
    /**
     * Run an event through its subscribed middleware and return the outcome.
     *
     * The returned {@link DispatchOutcome} carries the (possibly transformed)
     * payload and any gate decision. Order is registration order across all
     * addons.
     *
     * @param event   the event to dispatch
     * @param payload the initial payload threaded through the chain
     */
    dispatch<TPayload>(event: HookEvent, payload: TPayload): Promise<DispatchOutcome<TPayload>>;
    /** Whether any addon has subscribed to the given event. */
    has(event: HookEvent): boolean;
    /** Register a listener for per-handler {@link AddonFault}s. Returns an unsubscribe. */
    onFault(listener: AddonFaultListener): () => void;
}
/**
 * The result of dispatching one event through the {@link EventDispatcher}.
 *
 * `payload` is the value after every `transform` handler has run (identical to
 * the input when none transformed it). `gate`, when present, is the first
 * stopping {@link GateDecision} a `gate` handler returned; consumers treat a
 * `gate.stop === true` as a veto of whatever the event guards.
 */
export interface DispatchOutcome<TPayload> {
    /** The payload after all transform middleware ran. */
    readonly payload: TPayload;
    /** The stopping gate decision, if any handler vetoed the flow. */
    readonly gate?: GateDecision;
}
/**
 * The arguments a tool is about to be invoked with, passed to a
 * {@link ToolInterceptor.enter} stage so it can inspect or rewrite them.
 *
 * `args` is the decoded parameter object the agent built for this call; a stage
 * may return a replacement (or a {@link GateDecision} to block the call
 * outright). Field names are this layer's own — not the framework's tool-call
 * schema.
 */
export interface ToolEnterContext {
    /** Wire-facing name of the tool being invoked. */
    readonly tool: string;
    /** Stable id correlating this enter with its matching exit. */
    readonly callId: string;
    /** The decoded parameter object the tool will execute against. */
    readonly args: Readonly<Record<string, unknown>>;
}
/**
 * The result a tool produced (or the error it threw), passed to a
 * {@link ToolInterceptor.exit} stage so it can inspect or rewrite the outcome.
 *
 * Carries the framework {@link AgentToolResult} on success; on failure `error`
 * is set and `result` is absent. An exit stage may return a replacement result
 * (e.g. to redact, annotate, or recover) which the chain threads onward.
 */
export interface ToolExitContext {
    /** Wire-facing name of the tool that ran. */
    readonly tool: string;
    /** Stable id correlating this exit with its enter. */
    readonly callId: string;
    /** The result the tool produced, when it succeeded. */
    readonly result?: AgentToolResult<unknown>;
    /** The error the tool threw, when it failed. */
    readonly error?: unknown;
}
/**
 * What a {@link ToolInterceptor.enter} stage may return.
 *
 *   - `undefined` / nothing — leave the args unchanged, continue the chain.
 *   - a partial {@link ToolEnterContext} with new `args` — replace the arguments.
 *   - a {@link GateDecision} with `stop: true` — block the tool call entirely.
 */
export type EnterOutcome = void | {
    readonly args: Readonly<Record<string, unknown>>;
} | GateDecision;
/**
 * What a {@link ToolInterceptor.exit} stage may return.
 *
 *   - `undefined` / nothing — leave the outcome unchanged, continue the chain.
 *   - a replacement {@link AgentToolResult} — rewrite the tool's result.
 */
export type ExitOutcome = void | AgentToolResult<unknown>;
/**
 * A single stage in the tool-boundary {@link InterceptorChain}.
 *
 * Replaces the nested before/after wrapper with a composable stage that
 * straddles tool execution: `enter` runs before the tool (may rewrite args or
 * block), `exit` runs after (may rewrite the result). Either may be omitted. The
 * chain applies `enter` stages forward and `exit` stages in reverse, so an addon
 * loaded first wraps the outermost layer. Provenance is carried for attribution.
 */
export interface ToolInterceptor {
    /**
     * Which tools this interceptor applies to: a specific tool name, or `"*"` for
     * every tool.
     */
    readonly match: string | "*";
    /** The addon that registered this interceptor, for error attribution. */
    readonly addon: AddonId;
    /** Pre-execution stage: inspect/rewrite args or block the call. */
    enter?(ctx: ToolEnterContext): EnterOutcome | Promise<EnterOutcome>;
    /** Post-execution stage: inspect/rewrite the result. */
    exit?(ctx: ToolExitContext): ExitOutcome | Promise<ExitOutcome>;
}
/**
 * The ordered pipeline that threads a single tool execution through every
 * matching {@link ToolInterceptor}.
 *
 * This is the tool-boundary integration point: it folds the registered
 * interceptors around the real `AgentTool.execute`, running `enter` stages
 * forward (honoring an early block), executing the tool, then running `exit`
 * stages in reverse. It replaces both the old tool wrapper and the dotted
 * before/after hook trigger with one reduce.
 */
export interface InterceptorChain {
    /**
     * Run a tool's execution through the interceptor pipeline.
     *
     * Applies matching `enter` stages (rewriting args, or short-circuiting on a
     * block), invokes `execute` with the final args, then applies matching `exit`
     * stages in reverse. A blocked enter resolves without calling `execute`.
     *
     * @param ctx     the entering call context (tool, callId, initial args)
     * @param execute the real tool invocation, called with the final args
     */
    run(ctx: ToolEnterContext, execute: (args: Readonly<Record<string, unknown>>) => Promise<AgentToolResult<unknown>>): Promise<InterceptResult>;
    /** Whether any interceptor matches the given tool name. */
    matches(tool: string): boolean;
}
/**
 * The outcome of running a tool through the {@link InterceptorChain}.
 *
 * On a normal run `result` holds the (possibly rewritten) tool result. When an
 * `enter` stage blocked the call, `blocked` carries the {@link GateDecision} and
 * `result` is absent — the tool never executed.
 */
export interface InterceptResult {
    /** The final tool result, when the call was allowed to run. */
    readonly result?: AgentToolResult<unknown>;
    /** The blocking decision, when an enter stage vetoed the call. */
    readonly blocked?: GateDecision;
}
/**
 * A tool an addon contributes to the session.
 *
 * Deliberately an alias of the framework {@link AgentTool} rather than a fresh
 * descriptor: the agent loop consumes `AgentTool` objects directly, so an
 * addon's job is to *supply* one, not to wrap it. `TParameters` is left open so
 * heterogeneous addon tools coexist in one `AddonTool[]`.
 */
export type AddonTool<TParameters extends TSchema = TSchema, TDetails = unknown> = AgentTool<TParameters, TDetails>;
/**
 * Where a slash {@link AddonCommand} runs and what it can reach.
 *
 * Handed to a command handler at invocation time: the parsed argument string,
 * the workspace root, and a small set of framework handles (so the command can
 * send a message, switch the model, or drive the TUI) without the addon holding
 * global state. Optional handles are absent in non-interactive run modes.
 */
export interface CommandContext {
    /** The raw argument string following the command name. */
    readonly args: string;
    /** Absolute working directory the session is scoped to. */
    readonly cwd: string;
    /** Framework handles the command may use (model switch, message send, TUI). */
    readonly handles: FrameworkHandles;
}
/**
 * A slash command an addon contributes.
 *
 * The model never calls a command — the user does, by name. `name` is the
 * invocation token (without a leading slash), `summary` lines it in help, and
 * `run` executes it against a {@link CommandContext}. Provenance is carried for
 * conflict diagnostics when two addons claim the same name.
 */
export interface AddonCommand {
    /** Invocation token (no leading slash), unique across loaded addons. */
    readonly name: string;
    /** One-line description for the command palette / help listing. */
    readonly summary: string;
    /** The addon that registered this command, for conflict attribution. */
    readonly addon: AddonId;
    /**
     * Execute the command.
     *
     * @param ctx the invocation context (args, cwd, framework handles)
     */
    run(ctx: CommandContext): void | Promise<void>;
}
/**
 * The bag of framework handles an addon may reach through — exposed on the
 * {@link AddonSurface} and threaded into a {@link CommandContext}.
 *
 * These are the controlled callbacks an addon uses to act on the session
 * (instead of importing and mutating agent internals). Every handle is optional:
 * a print/JSON run mode supplies fewer than an interactive TUI. The shapes are
 * intentionally minimal — richer wiring is the host's concern, not the
 * contract's.
 */
export interface FrameworkHandles {
    /** Inject an assistant-visible message into the active turn. */
    readonly sendMessage?: (text: string) => void | Promise<void>;
    /** Switch the active model by canonical id. */
    readonly setModel?: (id: string) => void | Promise<void>;
    /** Adjust the reasoning-effort level for subsequent turns. */
    readonly setThinking?: (level: ThinkingLevel) => void;
    /** Render an ephemeral TUI component (absent outside interactive mode). */
    readonly render?: (component: Component) => void;
    /** Run a shell command and resolve its captured output. */
    readonly exec?: (command: string) => Promise<ExecOutcome>;
}
/**
 * The captured outcome of a {@link FrameworkHandles.exec} invocation.
 *
 * A small, framework-agnostic shape: the process's standard streams and exit
 * code, so an addon can branch on success without parsing a richer result.
 */
export interface ExecOutcome {
    /** Captured standard output. */
    readonly stdout: string;
    /** Captured standard error. */
    readonly stderr: string;
    /** Process exit code (`0` on success), or `null` if terminated by signal. */
    readonly code: number | null;
}
/**
 * The registration API a single addon receives in its
 * {@link AddonManifest.register} entry point.
 *
 * Each method *records* a contribution rather than mutating global agent state:
 * the host hands a fresh surface to each addon, the addon calls these to
 * describe what it wants, and the host reads the accumulated
 * {@link RegisteredManifest} back out via {@link AddonSurface.manifest}.
 * Read-only access to framework handles is provided through
 * {@link AddonSurface.handles} for the rare case an addon must act at
 * registration time.
 */
export interface AddonSurface {
    /** The id of the addon this surface is scoped to. */
    readonly id: AddonId;
    /**
     * Subscribe a {@link HookHandler} to a colon-named {@link HookEvent}.
     *
     * The handler's {@link HookHandler.kind} selects whether it observes,
     * transforms, or gates the event. Records an {@link EventSubscription}.
     *
     * @param event   the event to hook
     * @param handler the observe/transform/gate middleware
     */
    on<TPayload>(event: HookEvent, handler: HookHandler<TPayload>): void;
    /**
     * Register a {@link ToolInterceptor} for the tool-boundary pipeline.
     *
     * @param name the tool name to intercept, or `"*"` for every tool
     * @param interceptor the enter/exit stage (its `match`/`addon` are filled by the surface)
     */
    interceptTool(name: string | "*", interceptor: Omit<ToolInterceptor, "match" | "addon">): void;
    /**
     * Register a slash command.
     *
     * @param name    invocation token (no leading slash)
     * @param handler the command definition (its `name`/`addon` are filled by the surface)
     */
    addCommand(name: string, handler: Omit<AddonCommand, "name" | "addon">): void;
    /**
     * Register an LLM-callable tool.
     *
     * @param card the framework {@link AddonTool} to add to the session's deck
     */
    addTool(card: AddonTool): void;
    /**
     * Read-only access to the framework handles an addon may act through at
     * registration time. The same shape is threaded into command contexts.
     */
    readonly handles: FrameworkHandles;
    /**
     * The accumulated {@link RegisteredManifest} of everything recorded so far.
     *
     * The host reads this after `register` settles to fold the addon's
     * contributions into its single registry. Recording-then-returning, not
     * mutating-global-state, is the whole point of the surface.
     */
    manifest(): RegisteredManifest;
}
/**
 * The injectable seam that turns a source path into an {@link AddonManifest}.
 *
 * The default implementation is jiti-backed: it builds a sandbox over the
 * {@link BUNDLED_NAMESPACES} (via jiti's `virtualModules` in a compiled binary
 * or `alias` in Node/dev) and imports the module's default/`register` export. A
 * test injects a fake that returns a scripted manifest with no real jiti and no
 * filesystem — the host code never assumes a concrete loader, only this
 * interface.
 */
export interface ModuleLoader {
    /**
     * Resolve and load the addon module at `path`, returning its
     * {@link AddonManifest}.
     *
     * Implementations isolate import failures and surface them as a rejected
     * promise (the host converts the rejection into an {@link AddonFault}).
     *
     * @param path absolute path to the addon's entry module
     */
    load(path: string): Promise<AddonManifest>;
}
/**
 * Configuration for discovering addon source modules.
 *
 * Discovery walks a set of roots — by default the per-workspace `.indus/addons`
 * directory — plus any explicitly configured paths, yielding the entry modules
 * the {@link ModuleLoader} will load. The directory name and field are this
 * app's own vocabulary.
 */
export interface AddonDiscovery {
    /**
     * The workspace root whose `.indus/addons` directory is scanned. When absent,
     * only {@link explicitPaths} are used.
     */
    readonly workspace?: string;
    /**
     * The directory (relative to {@link workspace}) addons are discovered in.
     * Defaults to {@link ADDONS_DIR}.
     */
    readonly dir?: string;
    /** Additional absolute paths to addon entry modules, loaded as-is. */
    readonly explicitPaths?: readonly string[];
}
/**
 * The default per-workspace directory addons are discovered in, relative to the
 * workspace root. This app's own vocabulary.
 */
export declare const ADDONS_DIR: ".indus/addons";
/**
 * The `package.json` field an addon package uses to declare its entry module —
 * this app's own manifest key. The discovery walker reads this when a candidate
 * is a package directory rather than a bare module file.
 */
export declare const ADDON_MANIFEST_FIELD: "indusAddon";
/**
 * One discovered addon source the loader will resolve.
 *
 * Produced by discovery and consumed by the {@link ModuleLoader}: the absolute
 * entry `path` and a stable {@link AddonId} derived for it (from the declared id
 * or the path). Distinct from the loaded {@link AddonManifest} — a source is
 * "where", a manifest is "what".
 */
export interface AddonSource {
    /** Stable id assigned to this source for attribution and de-duplication. */
    readonly id: AddonId;
    /** Absolute path to the addon's entry module. */
    readonly path: string;
}
/**
 * The closed set of failure categories the addon system can surface.
 *
 *   - `load`        — resolving/importing an addon module failed.
 *   - `register`    — an addon's `register` entry point threw.
 *   - `handler`     — an event handler or interceptor stage threw at runtime.
 *   - `command`     — a slash command handler threw.
 *   - `conflict`    — two addons claimed the same command name (or tool id).
 */
export type AddonFaultKind = "load" | "register" | "handler" | "command" | "conflict";
/**
 * A typed, discriminated failure raised by the addon system.
 *
 * `kind` selects the category; `message` is a human-readable summary; `addon`
 * (when known) attributes it to the originating addon; the optional `cause`
 * carries the underlying error for logging without forcing consumers to parse
 * the message. Construct one with {@link addonFault}.
 */
export interface AddonFault {
    /** Failure category — the discriminant consumers switch on. */
    readonly kind: AddonFaultKind;
    /** Human-readable, single-line summary of what went wrong. */
    readonly message: string;
    /** The addon the fault is attributed to, when known. */
    readonly addon?: AddonId;
    /** Underlying error or structured detail, if any. */
    readonly cause?: unknown;
}
/** A subscriber for {@link AddonFault}s routed off the dispatcher / host. */
export type AddonFaultListener = (fault: AddonFault) => void;
/**
 * Construct an {@link AddonFault}. The single sanctioned minter, so the shape
 * stays uniform across every producer.
 *
 * @param kind    the failure category
 * @param message a human-readable, single-line summary
 * @param detail  optional `{ addon, cause }` provenance
 */
export declare function addonFault(kind: AddonFaultKind, message: string, detail?: {
    addon?: AddonId;
    cause?: unknown;
}): AddonFault;
