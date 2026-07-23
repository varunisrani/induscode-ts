// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Bridge-key minting — stable identifiers for enrolled MCP capabilities.
 *
 * An enrolled bridge capability needs a key that is *the same* across sessions
 * for the same external tool, so re-enrolling is an idempotent upsert rather
 * than an accumulating duplicate. The catalog already settled this policy in the
 * contract: a {@link BridgeKey} is "a content hash of the qualified
 * `<server>__<tool>` name (and its schema) or a fresh ULID" — keyed by the
 * capability's *identity*, never by a working-directory digest.
 *
 * This module implements both halves of that policy and nothing else:
 *
 *   - {@link bridgeContentKey} — the default. A deterministic digest of the
 *     qualified name plus the canonicalized parameter schema. Two enrollments of
 *     the same remote tool (same name, same schema) collapse to one key, so the
 *     ledger upsert is naturally idempotent and the live set never duplicates a
 *     tool just because a server reconnected.
 *   - {@link bridgeUlidKey} — an opt-in, monotonic, time-sortable ULID for the
 *     rare case a caller wants every enrollment to be a distinct event (e.g. an
 *     ephemeral, per-invocation graft) rather than a deduplicated identity.
 *
 * Both return a branded {@link BridgeKey}; neither touches the filesystem, the
 * clock-as-state, or any shared mutable value.
 */
import type { TSchema } from "@sinclair/typebox";
import { type BridgeKey } from "../contract";
/**
 * The qualified, collision-free name the model sees for a remote tool —
 * `"<server>__<tool>"`, using the framework's bridge {@link QUALIFIER}.
 *
 * The protocol bridge already stamps this exact form onto each grafted tool's
 * descriptor; we recompute it here only so a key can be minted *before* a
 * descriptor is in hand (e.g. from a {@link RemoteToolRef}-shaped pair).
 *
 * @param server the owning MCP server's id
 * @param tool   the remote tool's own (unqualified) name
 */
export declare function qualifyBridgeName(server: string, tool: string): string;
/**
 * Mint a content-addressed {@link BridgeKey} from a remote tool's identity.
 *
 * The digest is taken over the qualified `<server>__<tool>` name and the
 * canonicalized parameter schema, so the key is a pure function of *what the
 * tool is*. Enrolling the same tool twice yields the same key — the ledger
 * upsert deduplicates it — while a tool whose schema changed yields a new key,
 * correctly surfacing it as a distinct capability.
 *
 * @param server     the owning MCP server's id
 * @param tool       the remote tool's own (unqualified) name
 * @param parameters the tool's parameter schema (TypeBox or raw JSON Schema)
 */
export declare function bridgeContentKey(server: string, tool: string, parameters?: TSchema | Record<string, unknown>): BridgeKey;
/**
 * Mint a fresh, time-sortable {@link BridgeKey} as a ULID.
 *
 * Use when each enrollment must be a *distinct* event rather than a deduplicated
 * identity — for instance an ephemeral, per-invocation graft, or when two
 * differently-configured connections to the same server should each get their
 * own live entry. The ULID is monotonic within a process so ordering is stable.
 *
 * @param monotonic when true (default) use the process-monotonic generator so
 *   keys minted in the same millisecond remain strictly increasing; pass false
 *   for a plain, independent ULID.
 */
export declare function bridgeUlidKey(monotonic?: boolean): BridgeKey;
