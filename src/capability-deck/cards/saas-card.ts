// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * SaaS-action capability — a thin wrapper over the framework's connector gateway
 * (Composio-style remote tool execution).
 *
 * The heavy lifting (authenticating to a vendor, resolving toolkit scopes,
 * executing a remote tool slug) lives in the framework's `connectors-saas`
 * layer. This card does NOT re-implement any of it; it adapts an injected
 * gateway handle to the deck's {@link Capability} shape so the agent can invoke
 * remote SaaS actions by slug. When no gateway is wired into the context the card
 * still builds and returns a typed stub, so the deck assembles in every
 * environment.
 *
 * The single tool keys behavior on an `action` discriminant:
 *   - `discover` — list executable remote tool slugs (optionally filtered).
 *   - `execute`  — run one remote tool slug with arguments.
 *
 * Vendor-defined identifiers (uppercase tool slugs like `GITHUB_CREATE_ISSUE`)
 * are passed through verbatim — they are part of the connector's wire contract.
 */
import { type Static } from "@sinclair/typebox";
import type { Capability, CapabilityCard, DeckContext } from "../contract";
/** Key under which a host wires a live SaaS gateway into the deck context. */
export declare const SAAS_GATEWAY_KEY: "saasGateway";
/** One executable remote tool advertised by the connector. */
export interface RemoteToolSummary {
    /** Vendor-defined slug, passed through verbatim (e.g. `GITHUB_CREATE_ISSUE`). */
    readonly slug: string;
    /** Human-readable description from the connector, if any. */
    readonly description?: string;
}
/** The outcome of executing one remote tool slug. */
export interface RemoteExecution {
    readonly ok: boolean;
    /** Connector payload, surfaced to the model as serialized text. */
    readonly data: unknown;
}
/**
 * The slice of a framework SaaS gateway this card adapts.
 *
 * Deliberately narrow — the deck only needs to list and execute remote tools.
 * The framework's full gateway (connection lifecycle, scope planning, status
 * reporting) is a superset; a host adapts it to this shape when wiring it in.
 */
export interface SaasGatewayPort {
    /** List executable remote tools, optionally filtered by toolkit or query. */
    discover(filter?: {
        toolkits?: string[];
        query?: string;
    }): Promise<RemoteToolSummary[]>;
    /** Execute one remote tool slug with arguments. */
    execute(slug: string, args: Record<string, unknown>): Promise<RemoteExecution>;
}
declare const SaasParams: import("@sinclair/typebox").TObject<{
    action: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"discover">, import("@sinclair/typebox").TLiteral<"execute">]>;
    slug: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    arguments: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    toolkits: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    query: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
/** Statically-inferred parameter type the capability's `execute` receives. */
export type SaasParamsType = Static<typeof SaasParams>;
/** Structured detail returned alongside the model-facing content. */
export interface SaasDetails {
    readonly action: "discover" | "execute";
    readonly ok: boolean;
    readonly slug?: string;
    readonly count?: number;
}
/**
 * Build the SaaS-action capability, adapting an injected gateway when present.
 *
 * @param ctx the deck context; an optional gateway is read from
 *            `ctx.framework[SAAS_GATEWAY_KEY]`.
 */
export declare function buildSaasCapability(ctx: DeckContext): Capability<typeof SaasParams, SaasDetails>;
/** Catalog row for the SaaS-action capability. */
export declare const saasCard: CapabilityCard;
export {};
