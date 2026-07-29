/**
 * Capability-deck contract — the FROZEN type surface of the tooling layer.
 *
 * This module is the single typed seam between the coding-agent *product* and
 * the set of callable capabilities the agent runtime executes — file ops, the
 * shell, search, the web, the delegate/subagent action, the checklist, the
 * background-process proxy, SaaS connector actions, and dynamically-grafted MCP
 * server tools. It declares *only* shapes plus a handful of tiny inert helpers
 * (an id brand, a key minter, a fault factory, and a pure ledger reducer) — no
 * I/O, no provisioning, no orchestration. Every later deck module (the manifest
 * catalog, the builtin bridge, the per-concern provisioners, the bridge network,
 * and the assembled `ToolDeck`) is written against the names declared here, so
 * the file is intentionally small, append-mostly, and stable.
 *
 * Design stance:
 *   - A {@link Capability} is exactly the framework `AgentTool` shape. The deck
 *     does not invent a parallel descriptor type; it *manages* AgentTools so the
 *     conductor can consume the deck's output directly as `options.tools`.
 *   - The catalog is a single source of truth: {@link CapabilityCard} rows live
 *     in one `CAPABILITY_CARDS` array (built by the manifest module), and every
 *     index/lookup is derived *from* that array rather than hand-maintained in a
 *     second parallel map.
 *   - Profiles replace a trio of near-identical build functions: one
 *     data-driven provisioner walks a {@link DeckProfile} ("authoring" |
 *     "survey" | "all") to assemble the right capability set for a session.
 *   - MCP enrollment is **event-sourced**: a {@link BridgeLedger} is the fold of
 *     an append-only stream of {@link BridgeEntry} events (`enroll` / `retire`),
 *     keyed by a content-hash / ULID {@link BridgeKey} rather than a path digest.
 *     The current view is a {@link LedgerSnapshot} reduced from that stream.
 *
 * Framework anchors (all from the `indusagi` package — the sibling rebuilt
 * framework this app targets):
 *   - `AgentTool`, `AgentToolResult`     ← `indusagi/agent`
 *   - `ToolBox`                          ← `indusagi/runtime`
 *   - `TSchema`, `Static`                ← `@sinclair/typebox`
 *
 * The deck never re-declares these; it composes them.
 */
// Local aliases for framework vocabulary that is not exported from the
// `indusagi` package. Kept loose (`unknown` payload) so deck consumers can
// thread framework-supplied values through without a parallel descriptor type.
/** The framework `AgentTool` shape (name, description, parameters, execute). */
import type { Static, TSchema } from "@sinclair/typebox";
export type AgentTool<TParameters = unknown, TDetails = unknown> = {
    name: string;
    label?: string;
    description?: string;
    parameters?: TParameters;
    readOnly?: boolean;
    execute?: (...args: unknown[]) => unknown;
    [k: string]: unknown;
};
/** The framework `AgentToolResult` (content parts + details). */
export type AgentToolResult<TDetails = unknown> = {
    content: readonly unknown[];
    details?: TDetails;
    [k: string]: unknown;
};
/** Opaque handle to a framework tool box. */
export type ToolBox = { [k: string]: unknown };

/** Re-exported framework vocabulary that deck consumers routinely need. */
export type { TSchema, Static };

/**
 * A single callable tool the deck manages.
 *
 * Deliberately an alias of the framework `AgentTool` rather than a fresh shape:
 * the conductor and the framework agent loop both expect `AgentTool` objects, so
 * the deck's whole job is to *assemble* them, not to wrap them in a parallel
 * descriptor. A `Capability` therefore carries the framework contract verbatim —
 * `name`, `label`, `description`, a TypeBox `parameters` schema, and an
 * async `execute` — while the deck owns only the catalog, profiles, and
 * dynamic-bridge layers around it.
 *
 * `TParameters` is left open (`TSchema`) so heterogeneous capabilities with
 * different parameter schemas coexist in one `Capability[]`.
 */
export type Capability<TParameters extends TSchema = TSchema, TDetails = unknown> =
    AgentTool<TParameters, TDetails>;

/**
 * A capability whose parameter/detail types are erased — the element type of a
 * heterogeneous deck.
 *
 * A `Capability[]` array of mixed schemas widens to `AnyCapability[]`; this is
 * the shape the conductor consumes as `options.tools` and the type the deck's
 * {@link ToolDeck.tools} / {@link ToolDeck.box} surface in.
 */
export type AnyCapability = Capability<TSchema, unknown>;

/**
 * String-branded stable identifier for a capability.
 *
 * The wire-facing tool `name` the model sees (e.g. `"read"`, `"bash"`,
 * `"composio_execute"`, a qualified `"<server>__<tool>"`); branded so an
 * arbitrary string cannot be passed where a vetted capability id is required.
 * Mint one with {@link capabilityId}.
 */
export type CapabilityId = string & {
    readonly __capability: unique symbol;
};

/**
 * Brand a raw string as a {@link CapabilityId}. The single sanctioned way to
 * produce one, so id provenance stays uniform across the catalog and bridge.
 *
 * @param raw the wire-facing tool name to brand
 */
export function capabilityId(raw: string): CapabilityId {
    return raw as CapabilityId;
}

/**
 * One row of the static capability catalog — the deck's single source of truth.
 *
 * A card is *metadata plus a builder*: it advertises the capability's identity
 * (`id`, `title`, `summary`) for help/introspection and slash-command listings,
 * and carries a {@link CapabilityCard.build} factory that mints the live
 * {@link Capability} for a given {@link DeckContext}. The catalog array
 * (`CAPABILITY_CARDS`, owned by the manifest module) is the only hand-maintained
 * list; every index, profile membership, and lookup is derived from it.
 */
export interface CapabilityCard {
    /** Stable, wire-facing identifier of the capability this card builds. */
    readonly id: CapabilityId;
    /** Short human-facing title for catalogs and help text. */
    readonly title: string;
    /** One-line description of what the capability does, in the deck's own voice. */
    readonly summary: string;
    /**
     * Build the live capability for a working context.
     *
     * Pure with respect to the deck: it reads the injected backends from `ctx`
     * and returns a configured {@link Capability}; it performs no enrollment and
     * mutates no shared state.
     *
     * @param ctx the working context (cwd + injectable backends) to bind to
     */
    build(ctx: DeckContext): Capability;
}

/**
 * The set of capabilities a card is eligible for, by profile.
 *
 * A card declares which {@link DeckProfile}s it participates in; the
 * data-driven provisioner intersects this with the requested profile instead of
 * branching through separate per-profile build functions. `"all"` is implied for
 * every card and need not be listed.
 */
export type CardProfiles = readonly DeckProfile[];

/**
 * The named capability sets a session can be provisioned with — the profile
 * table that replaces a trio of near-identical build functions.
 *
 *   - `authoring` — the READ-ONLY built-in subset: read/ls/search/web/
 *     checklist-read. No filesystem mutation, no shell, no app-novel cards —
 *     the deck sub-agents (task/workflow) are provisioned with (see
 *     {@link "./provision"}'s PROFILE_TABLE, the authoritative mapping).
 *   - `survey`    — every built-in (mutating ones included), no app-novel cards.
 *   - `all`       — every registered capability, nothing withheld. What an
 *     interactive coding session runs with.
 */
export type DeckProfile = "authoring" | "survey" | "all";

/**
 * The working context handed to {@link CapabilityCard.build}.
 *
 * Bundles the workspace root with the injectable backends a capability binds to,
 * so capabilities stay framework-agnostic and testable: a test passes fake
 * `fs` / `shell` ports, production passes the Node-backed ones. Every field
 * beyond `cwd` is optional — the manifest supplies framework defaults when a
 * backend is not injected.
 */
export interface DeckContext {
    /** Absolute working directory the session's capabilities are scoped to. */
    readonly cwd: string;
    /** Injectable filesystem port; framework Node backend is the default. */
    readonly fs?: DeckFsBackend;
    /** Injectable shell port; framework Node backend is the default. */
    readonly shell?: DeckShellBackend;
    /** Opaque framework handles a capability may need (model registry, stores). */
    readonly framework?: DeckFrameworkHandles;
}

/**
 * Filesystem backend port a capability may bind to.
 *
 * Intentionally opaque at the contract layer: the concrete port shape is owned
 * by the framework capabilities kernel. The deck only needs to *thread* it from
 * a host into a card's builder, so the contract treats it as a branded handle —
 * threaded, not interpreted, here.
 */
export type DeckFsBackend = {
    readonly __deckFsBackend: unique symbol;
};

/**
 * Shell backend port a capability may bind to. Opaque for the same reason as
 * {@link DeckFsBackend}: a branded handle the contract threads but never reads.
 */
export type DeckShellBackend = {
    readonly __deckShellBackend: unique symbol;
};

/**
 * A bag of opaque framework handles the novel capabilities wire to — the
 * subagent/delegate manager, the checklist ledger, the background-process
 * controller, the SaaS gateway. Each is optional and keyed by name; a card that
 * needs one reads it from here, and the manifest fills in defaults.
 */
export interface DeckFrameworkHandles {
    readonly [name: string]: unknown;
}

/**
 * The stable key of an enrolled bridge capability.
 *
 * Minted from the capability's identity rather than from a working-directory
 * digest, so the same external tool grafted from two sessions collapses to one
 * key and re-enrolling is idempotent. In practice a content hash of the
 * qualified `<server>__<tool>` name (and its schema) or a fresh ULID; branded so
 * a raw string cannot stand in for a vetted key.
 */
export type BridgeKey = string & {
    readonly __bridgeKey: unique symbol;
};

/** Brand a raw string as a {@link BridgeKey}. */
export function bridgeKey(raw: string): BridgeKey {
    return raw as BridgeKey;
}

/**
 * The operations the MCP enrollment stream records.
 *
 *   - `enroll` — a bridge capability became available and was grafted in (an
 *     upsert: re-enrolling the same {@link BridgeKey} replaces its entry).
 *   - `retire` — a bridge capability (or a whole server's set) was withdrawn (a
 *     splice: the keyed entry is removed from the reduced view).
 */
export type BridgeOp = "enroll" | "retire";

/**
 * A single append-only event in the MCP enrollment stream.
 *
 * The ledger is never mutated in place; every change is one of these entries
 * appended to an ordered log, and the live view is the fold of that log. An
 * `enroll` entry carries the grafted {@link Capability} and the owning server;
 * a `retire` entry need only name the {@link BridgeKey} (and server) to remove.
 * Field names are the deck's own, not the framework's registry schema.
 */
export interface BridgeEntry {
    /** The operation this event records. */
    readonly op: BridgeOp;
    /** Stable key of the bridge capability the event concerns. */
    readonly key: BridgeKey;
    /** Id of the external MCP server that owns the capability. */
    readonly server: string;
    /** The grafted capability — present on `enroll`, omitted on `retire`. */
    readonly capability?: AnyCapability;
    /** Monotonic sequence number; the append order, used to break upsert ties. */
    readonly seq: number;
    /** ISO-8601 timestamp the event was appended. */
    readonly at: string;
}

/**
 * The reduced, current view of the MCP enrollment ledger.
 *
 * A pure projection of the {@link BridgeEntry} stream: the set of bridge
 * capabilities live *right now*, keyed by {@link BridgeKey}, alongside the
 * highest sequence number folded and a per-server tool count for status
 * rendering. Produced by {@link reduceLedger}; consumers read it, never mutate.
 */
export interface LedgerSnapshot {
    /** Currently-enrolled bridge capabilities, keyed by their stable key. */
    readonly live: ReadonlyMap<BridgeKey, AnyCapability>;
    /** Number of live capabilities grafted from each server, keyed by server id. */
    readonly byServer: ReadonlyMap<string, number>;
    /** The highest {@link BridgeEntry.seq} folded into this snapshot. */
    readonly highWater: number;
}

/**
 * Fold an append-only {@link BridgeEntry} stream into its current
 * {@link LedgerSnapshot}.
 *
 * Pure and total: `enroll` upserts the keyed capability (later `seq` wins on a
 * repeated key), `retire` removes it, and entries are applied in `seq` order so
 * the result is independent of array order. This is the single sanctioned
 * reducer, so the event-sourced view stays consistent across every producer.
 *
 * @param entries the enrollment events to fold, in any order
 */
export function reduceLedger(entries: readonly BridgeEntry[]): LedgerSnapshot {
    const ordered = [...entries].sort((a, b) => a.seq - b.seq);
    const live = new Map<BridgeKey, AnyCapability>();
    let highWater = 0;
    for (const entry of ordered) {
        if (entry.seq > highWater) highWater = entry.seq;
        if (entry.op === "enroll") {
            if (entry.capability !== undefined) live.set(entry.key, entry.capability);
        } else {
            live.delete(entry.key);
        }
    }
    const keyServer = new Map<BridgeKey, string>();
    for (const entry of ordered) keyServer.set(entry.key, entry.server);
    const byServer = new Map<string, number>();
    for (const key of live.keys()) {
        const server = keyServer.get(key);
        if (server === undefined) continue;
        byServer.set(server, (byServer.get(server) ?? 0) + 1);
    }
    return { live, byServer, highWater };
}

/**
 * The assembled capability deck a session runs against.
 *
 * The product of provisioning a {@link DeckProfile} against a
 * {@link DeckContext}, optionally with bridge capabilities grafted on. It
 * exposes exactly two reads: the flat capability list (for inspection, naming,
 * and `--tools` style selection) and the consumable box the conductor wires in.
 *
 * `box()` returns an `AnyCapability[]` — the same `AgentTool[]` the conductor's
 * session options accept directly — so a deck drops straight into
 * `SessionConductorOptions.tools`. The {@link DeckBox} alias also admits the
 * framework `ToolBox` for hosts that drive the lower-level runtime contract
 * instead of the conductor.
 */
export interface ToolDeck {
    /** The flat list of live capabilities, for inspection and selection. */
    tools(): AnyCapability[];
    /** The consumable surface the conductor (or runtime) wires in as its tools. */
    box(): DeckBox;
}

/**
 * What {@link ToolDeck.box} hands to a consumer.
 *
 * Primarily an `AnyCapability[]` (= `AgentTool[]`), which the conductor accepts
 * verbatim as `options.tools`. Also admits the framework {@link ToolBox} so a
 * host wiring the raw runtime contract — or grafting MCP tools through the
 * protocol bridge, which yields a `ToolBox` — can consume the deck the same way.
 */
export type DeckBox = AnyCapability[] | ToolBox;

/**
 * The closed set of failure categories the deck can surface during
 * provisioning or bridge enrollment.
 *
 *   - `unknown_capability` — a requested id is not in the catalog.
 *   - `build_failed`       — a card's `build` threw while minting a capability.
 *   - `bridge`             — connecting/listing/grafting an MCP server failed.
 *   - `backend`            — a required injected backend was missing or invalid.
 */
export type DeckFaultKind = "unknown_capability" | "build_failed" | "bridge" | "backend";

/**
 * A typed, discriminated failure raised by the deck.
 *
 * `kind` selects the category; `message` is a human-readable summary; the
 * optional `cause` carries the underlying error for logging without forcing
 * consumers to parse the message. Construct one with {@link deckFault}.
 */
export interface DeckFault {
    /** Failure category — the discriminant consumers switch on. */
    readonly kind: DeckFaultKind;
    /** Human-readable, single-line summary of what went wrong. */
    readonly message: string;
    /** Underlying error or structured detail, if any. */
    readonly cause?: unknown;
}

/**
 * Construct a {@link DeckFault}. The single sanctioned way to mint one, so the
 * shape stays uniform across every producer.
 *
 * @param kind    the failure category
 * @param message a human-readable, single-line summary
 * @param cause   optional underlying error or structured detail
 */
export function deckFault(kind: DeckFaultKind, message: string, cause?: unknown): DeckFault {
    return cause === undefined ? { kind, message } : { kind, message, cause };
}