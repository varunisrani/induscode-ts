// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * The immutable bridge ledger — event-sourced enrollment of MCP capabilities.
 *
 * MCP tools are grafted in and pulled out over a session's life: a server
 * connects and contributes a handful of tools, another disconnects, the same
 * server reconnects after a hot-reload. Rather than mutate a shared module-level
 * array of live tools (which makes "who's enrolled right now" a function of call
 * order and hides every past change), enrollment here is an **append-only event
 * log** folded into a **derived snapshot**.
 *
 *   - {@link BridgeLedger} is a plain immutable value: the ordered
 *     {@link BridgeEntry} log, its already-folded {@link LedgerSnapshot}, and the
 *     next sequence number to stamp.
 *   - Every mutation ({@link enrollBridgeCard}, {@link retire},
 *     {@link withdrawServer}) returns a *new* ledger; the input is never touched.
 *     `enroll` is an upsert (re-enrolling a key replaces its entry), `retire` is
 *     a splice (the keyed entry is removed from the live view).
 *   - The live view is produced solely by the contract's pure
 *     {@link reduceLedger} fold, so the snapshot can never drift from the log.
 *
 * The log is the source of truth; the snapshot is a cache of its fold. Because
 * both live on the value, callers read `ledger.snapshot.live` directly and never
 * re-reduce by hand.
 */
import { type AnyCapability, type BridgeEntry, type BridgeKey, type LedgerSnapshot } from "../contract.js";
/**
 * An immutable, event-sourced view of MCP tool enrollment.
 *
 * Holds the append-only {@link BridgeEntry} log, the {@link LedgerSnapshot} that
 * is its current fold, and the sequence number the next appended entry will
 * carry. Treat every instance as frozen: the enroll/retire/withdraw helpers
 * derive a new ledger rather than editing this one in place.
 */
export interface BridgeLedger {
    /** The append-only enrollment event log, in append order. */
    readonly log: readonly BridgeEntry[];
    /** The current fold of {@link log} — the live capabilities and per-server counts. */
    readonly snapshot: LedgerSnapshot;
    /** The sequence number the next appended {@link BridgeEntry} will carry. */
    readonly nextSeq: number;
}
/**
 * The fields an enrollment supplies; the ledger stamps `op`, `seq`, and `at`.
 *
 * A caller names the capability, the owning server, and optionally a pre-minted
 * {@link BridgeKey}; when the key is omitted it is content-addressed from the
 * capability's identity so re-enrolling the same tool is idempotent.
 */
export interface EnrollRequest {
    /** The grafted capability to enroll (its `name` is the qualified tool name). */
    readonly capability: AnyCapability;
    /** Id of the external MCP server that owns the capability. */
    readonly server: string;
    /**
     * Optional explicit key. When omitted, a content key is derived from the
     * capability's qualified name and parameter schema so the enrollment upserts
     * any prior entry for the same tool instead of duplicating it.
     */
    readonly key?: BridgeKey;
}
/** An empty ledger: no events, an empty live view, sequence numbering at 1. */
export declare function emptyBridgeLedger(): BridgeLedger;
/**
 * Rebuild a ledger value from a persisted event log.
 *
 * The log is authoritative, so a ledger is fully reconstructable from it: fold
 * it for the snapshot and resume sequence numbering one past its high-water
 * mark. Use when rehydrating enrollment state across a restart.
 *
 * @param log the persisted append-only entries, in any order (sorted on fold)
 */
export declare function bridgeLedgerFromLog(log: readonly BridgeEntry[]): BridgeLedger;
/**
 * Append an `enroll` event and return the resulting ledger.
 *
 * The graft is an **upsert**: the appended entry carries a {@link BridgeKey}, and
 * because {@link reduceLedger} lets a later sequence win on a repeated key, a
 * re-enrollment of the same tool transparently replaces its prior live entry
 * rather than duplicating it. The input ledger is not mutated.
 *
 * @param ledger the current ledger (left untouched)
 * @param req    the capability + server to enroll, with an optional explicit key
 * @param at     enrollment timestamp; defaults to now (ISO-8601)
 */
export declare function enrollBridgeCard(ledger: BridgeLedger, req: EnrollRequest, at?: string): BridgeLedger;
/**
 * Append a `retire` event for one capability and return the resulting ledger.
 *
 * The withdrawal is a **splice**: the appended `retire` entry names the key, and
 * the fold drops that key from the live view. Retiring an unknown or
 * already-retired key is a harmless no-op in the live set (the event is still
 * recorded for the audit trail). The input ledger is not mutated.
 *
 * @param ledger the current ledger (left untouched)
 * @param key    the stable key of the capability to withdraw
 * @param server the owning server id, recorded on the event
 * @param at     retirement timestamp; defaults to now (ISO-8601)
 */
export declare function retire(ledger: BridgeLedger, key: BridgeKey, server: string, at?: string): BridgeLedger;
/**
 * Retire every capability a given server currently has live, in one batch.
 *
 * Appends one `retire` event per live key owned by the server — the disconnect
 * counterpart to grafting a whole server's tool set. Servers with nothing live
 * yield the ledger unchanged. The input ledger is not mutated.
 *
 * @param ledger the current ledger (left untouched)
 * @param server the server whose live capabilities should all be withdrawn
 * @param at     retirement timestamp applied to every event; defaults to now
 */
export declare function withdrawServer(ledger: BridgeLedger, server: string, at?: string): BridgeLedger;
/**
 * Read the live capabilities a single server currently contributes.
 *
 * Pure projection over the snapshot; the per-key→server association is recovered
 * from the log (each live key's last-touching server). Handy for status panels
 * and for {@link withdrawServer}'s batch retirement.
 *
 * @param ledger the ledger to read
 * @param server the server id to filter by
 */
export declare function liveCapabilitiesForServer(ledger: BridgeLedger, server: string): AnyCapability[];
/**
 * The flat list of every live capability, in stable iteration order.
 *
 * What a deck assembler grafts onto the static catalog before handing the
 * conductor its `options.tools`.
 */
export declare function liveCapabilities(ledger: BridgeLedger): AnyCapability[];
