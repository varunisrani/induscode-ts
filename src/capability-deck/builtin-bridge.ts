/**
 * Built-in capability bridge — ONE seam to the framework's native tools.
 *
 * The framework (`indusagi/agent`, the `actions` surface) already authors its
 * file, search, shell, web, process, and checklist tools as fully-formed
 * `AgentTool` objects and ships a `create<Name>Tool(cwd, options)` factory for
 * each. This module is the single place the deck reaches across that seam: it
 * pairs every native factory with a deck {@link CapabilityCard.build} closure so
 * the whole framework tool set is re-exposed as {@link Capability} rows in one
 * file rather than in a dozen one-line re-export stubs.
 *
 * What this buys the rest of the deck:
 *   - {@link BUILTIN_BRIDGE} — a single record keyed by the wire-facing tool
 *     name, each value a {@link BridgeBuilder} that mints the live capability for
 *     a {@link DeckContext}. The manifest derives its catalog rows from this
 *     record; nothing else hand-maintains a parallel list of built-ins.
 *   - {@link buildBuiltin} — resolve-and-build one built-in by id, surfacing a
 *     typed {@link DeckFault} on an unknown id or a builder throw.
 *   - {@link BUILTIN_PROFILES} — the per-built-in profile membership the
 *     data-driven provisioner intersects with a requested {@link DeckProfile},
 *     so the survey (observe-only) set falls out of one table instead of a
 *     second hand-written tool list.
 *
 * Design notes:
 *   - The builders thread `ctx.cwd` (and, where a factory takes them, the
 *     framework option bags) into the native factory. They never reimplement the
 *     tool — the framework owns the read/edit/grep/bash/etc. behavior; the bridge
 *     only *binds* it to a working context and re-labels it for the catalog.
 *   - The process and checklist tools are stateful framework singletons exposed
 *     through their factories; the bridge keeps them framework-backed (wrapping
 *     the framework, not any third-party package) while presenting them as plain
 *     capabilities to the deck.
 *   - All model-facing tool `name` strings are the framework's own wire contract
 *     (`read`, `bash`, `grep`, …) and are kept verbatim — the model's prompt and
 *     the conductor key off them. Only the deck-side titles/summaries are the
 *     deck's own prose.
 */
import {
    createReadTool,
    createWriteTool,
    createEditTool,
    createLsTool,
    createGrepTool,
    createFindTool,
    createBashTool,
    createProcessTool,
    createWebSearchTool,
    createWebFetchTool,
    createTodoReadTool,
    createTodoWriteTool,
} from "indusagi/agent";
import {
    capabilityId,
    deckFault,
    type AnyCapability,
    type Capability,
    type CapabilityId,
    type CardProfiles,
    type DeckContext,
} from "./contract.js";

/**
 * A closure that mints one framework built-in {@link Capability} for a working
 * context. The deck's view of a native factory after the bridge has bound the
 * `cwd` (and any option bag) the factory needs.
 *
 * Returns `AnyCapability` because the heterogeneous built-ins carry different
 * parameter schemas; a typed `AgentTool<TSchema>` widens to this element type,
 * which is exactly what the deck and the conductor consume.
 */
export type BridgeBuilder = (ctx: DeckContext) => AnyCapability;

/**
 * One descriptor in the built-in catalog: the wire-facing id, the deck-side
 * title/summary prose, the profiles the tool participates in, and the
 * {@link BridgeBuilder} that binds the framework factory to a context.
 *
 * The manifest turns each of these into a {@link CapabilityCard}; consumers that
 * want the raw built-in set read {@link BUILTIN_BRIDGE} directly.
 */
export interface BuiltinDescriptor {
    /** Wire-facing tool name the model invokes (framework contract, verbatim). */
    readonly id: CapabilityId;
    /** Short human-facing title for catalogs and help text. */
    readonly title: string;
    /** One-line description in the deck's own voice. */
    readonly summary: string;
    /** Which deck profiles this built-in belongs to. */
    readonly profiles: CardProfiles;
    /** Bind the framework factory to a working context. */
    readonly build: BridgeBuilder;
}

/**
 * Profile membership for read-only framework built-ins.
 *
 * Every observe-only built-in (read/ls/grep/find/web search & fetch/checklist
 * read) participates in both `authoring` (sub-agent) and `survey` (full
 * read-only) profiles.
 */
export const READ_ONLY: CardProfiles = ["authoring", "survey"];

/**
 * Profile membership for mutating framework built-ins.
 *
 * Mutating built-ins (write/edit/bash/process/checklist write) participate only
 * in the `authoring` profile (sub-agents), not the read-only survey set.
 */
export const MUTATING: CardProfiles = ["authoring"];

/**
 * The ordered list of built-in descriptors — the manifest projects its catalog
 * rows from this, preserving order.
 *
 * Each row pairs a framework-native factory (`create<Name>Tool`) with deck-side
 * prose and profile membership. Order is the model's enumeration order.
 */
export const BUILTIN_DESCRIPTORS: readonly BuiltinDescriptor[] = [
    {
        id: capabilityId("read"),
        title: "Read file",
        summary:
            "Return the contents of a file at a path, optionally from an offset and capped to a line limit; renders images inline where supported.",
        profiles: READ_ONLY,
        build: (ctx) =>
            createReadTool(ctx.cwd, {
                readState: ctx.framework?.["readState"],
            }),
    },
    {
        id: capabilityId("ls"),
        title: "List directory",
        summary: "Enumerate the entries of a directory, with an optional cap on how many are returned.",
        profiles: READ_ONLY,
        build: (ctx) => createLsTool(ctx.cwd),
    },
    {
        id: capabilityId("grep"),
        title: "Search file contents",
        summary:
            "Scan files for lines matching a pattern, with optional case-insensitivity, literal matching, surrounding context, and a result cap.",
        profiles: READ_ONLY,
        build: (ctx) => createGrepTool(ctx.cwd),
    },
    {
        id: capabilityId("find"),
        title: "Find files by name",
        summary:
            "Locate files and directories whose names match a glob-style pattern beneath a root, capped to a result limit.",
        profiles: READ_ONLY,
        build: (ctx) => createFindTool(ctx.cwd),
    },
    {
        id: capabilityId("websearch"),
        title: "Web search",
        summary:
            "Query the live web for a string and return a ranked set of result snippets, capped to a requested count.",
        profiles: READ_ONLY,
        build: () => createWebSearchTool(),
    },
    {
        id: capabilityId("webfetch"),
        title: "Fetch URL",
        summary:
            "Retrieve a single URL and return its body as text, Markdown, or HTML, with an optional request timeout.",
        profiles: READ_ONLY,
        build: () => createWebFetchTool(),
    },
    {
        id: capabilityId("todoread"),
        title: "Read checklist",
        summary:
            "Read back the session's running task checklist so the agent can review what is pending, active, or done.",
        profiles: READ_ONLY,
        // The framework's default in-memory checklist singleton; a session-aware
        // persistent store is wired by the separate checklist provisioner, not here.
        build: () => createTodoReadTool(),
    },
    {
        id: capabilityId("write"),
        title: "Write file",
        summary: "Create or overwrite a file at a path with the given contents, making parent directories as needed.",
        profiles: MUTATING,
        build: (ctx) =>
            createWriteTool(ctx.cwd, {
                readState: ctx.framework?.["readState"],
                checkpoint: ctx.framework?.["checkpoint"],
            }),
    },
    {
        id: capabilityId("edit"),
        title: "Edit file",
        summary:
            "Apply a find-and-replace edit to a file, swapping an exact span of old text for new text and reporting the resulting diff.",
        profiles: MUTATING,
        build: (ctx) =>
            createEditTool(ctx.cwd, {
                readState: ctx.framework?.["readState"],
                checkpoint: ctx.framework?.["checkpoint"],
            }),
    },
    {
        id: capabilityId("bash"),
        title: "Run shell command",
        summary:
            "Execute a shell command in the working directory, streaming its output and honoring an optional timeout.",
        profiles: MUTATING,
        build: (ctx) => createBashTool(ctx.cwd),
    },
    {
        id: capabilityId("process"),
        title: "Manage background processes",
        summary:
            "Start, list, inspect, feed input to, and stop long-running background commands without blocking the agent on them.",
        profiles: MUTATING,
        build: (ctx) => createProcessTool({ cwd: ctx.cwd }),
    },
    {
        id: capabilityId("todowrite"),
        title: "Update checklist",
        summary: "Replace or amend the session's task checklist, setting each item's text, status, and priority.",
        profiles: MUTATING,
        // Paired with the read singleton above; both share the framework default
        // in-memory store. The checklist provisioner swaps in a persistent store.
        build: () => createTodoWriteTool(),
    },
];

/**
 * The framework built-ins keyed by their wire-facing {@link CapabilityId} — the
 * single record the manifest and provisioner read from.
 *
 * Derived from {@link BUILTIN_DESCRIPTORS}, so the keyed view and the ordered
 * list never drift: there is exactly one place a built-in is declared.
 */
export const BUILTIN_BRIDGE: Readonly<Record<string, BuiltinDescriptor>> = Object.freeze(
    Object.fromEntries(BUILTIN_DESCRIPTORS.map((d) => [d.id, d])),
);

/**
 * The wire-facing ids of every framework built-in, in catalog order. Convenient
 * for `--tools` style selection and for the manifest's projection.
 */
export const BUILTIN_IDS: readonly CapabilityId[] = BUILTIN_DESCRIPTORS.map((d) => d.id);

/**
 * The profile membership of every built-in, keyed by id — the slice of the
 * profile table the data-driven provisioner reads to decide which built-ins a
 * requested {@link DeckProfile} includes.
 */
export const BUILTIN_PROFILES: Readonly<Record<string, CardProfiles>> = Object.freeze(
    Object.fromEntries(BUILTIN_DESCRIPTORS.map((d) => [d.id, d.profiles])),
);

/**
 * The ordered list of built-in descriptors — the manifest projects its catalog
 * rows from this, preserving order.
 */
export function builtinDescriptors(): readonly BuiltinDescriptor[] {
    return BUILTIN_DESCRIPTORS;
}

/**
 * Resolve a built-in by id and build its live capability for a context.
 *
 * Throws a typed {@link DeckFault}: `unknown_capability` when the id is not a
 * framework built-in, or `build_failed` when the framework factory throws. This
 * is the sanctioned entry point so failure shaping stays uniform across the deck.
 *
 * @param id   the wire-facing built-in name to build
 * @param ctx  the working context to bind the factory to
 */
export function buildBuiltin(id: CapabilityId, ctx: DeckContext): Capability {
    const descriptor = BUILTIN_BRIDGE[id];
    if (descriptor === undefined) {
        throw deckFault(
            "unknown_capability",
            `No framework built-in is registered under "${id}".`,
        );
    }
    try {
        return descriptor.build(ctx);
    } catch (cause) {
        throw deckFault(
            "build_failed",
            `Framework built-in "${id}" failed to build.`,
            cause,
        );
    }
}

/**
 * Build every framework built-in eligible for a profile, bound to a context.
 *
 * Walks the bridge table once, keeps each built-in whose profile membership
 * admits the requested profile (`all` admits everything), and binds it. A single
 * data-driven pass replaces a trio of per-profile build functions.
 *
 * @param profile the requested deck profile
 * @param ctx     the working context to bind each factory to
 */
export function buildBuiltinsForProfile(
    profile: "authoring" | "survey" | "all",
    ctx: DeckContext,
): AnyCapability[] {
    const built: AnyCapability[] = [];
    for (const descriptor of BUILTIN_DESCRIPTORS) {
        if (profile !== "all" && !descriptor.profiles.includes(profile)) continue;
        built.push(buildBuiltin(descriptor.id, ctx));
    }
    return built;
}