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
import { Type, type Static } from "@sinclair/typebox";
import { capabilityId, type Capability, type CapabilityCard, type DeckContext } from "../contract.js";

/** Key under which a host wires a live SaaS gateway into the deck context. */
export const SAAS_GATEWAY_KEY = "saasGateway" as const;

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

const SaasParams = Type.Object(
    {
        action: Type.Union([Type.Literal("discover"), Type.Literal("execute")], {
            description:
                "`discover` lists available remote tool slugs; `execute` runs one slug with arguments.",
        }),
        slug: Type.Optional(
            Type.String({
                description:
                    "Vendor tool slug to run (e.g. GITHUB_CREATE_ISSUE). Required for `execute`.",
            }),
        ),
        arguments: Type.Optional(
            Type.Record(Type.String(), Type.Unknown(), {
                description: "Arguments object for the remote tool, as the connector expects.",
            }),
        ),
        toolkits: Type.Optional(
            Type.Array(Type.String(), {
                description: "On `discover`, restrict results to these toolkit names.",
            }),
        ),
        query: Type.Optional(
            Type.String({
                description: "On `discover`, free-text filter over available tools.",
            }),
        ),
    },
    { additionalProperties: false },
);

/** Statically-inferred parameter type the capability's `execute` receives. */
export type SaasParamsType = Static<typeof SaasParams>;

/** Structured detail returned alongside the model-facing content. */
export interface SaasDetails {
    readonly action: "discover" | "execute";
    readonly ok: boolean;
    readonly slug?: string;
    readonly count?: number;
}

const SAAS_DESCRIPTION =
    'Discover and run third-party SaaS actions (GitHub, Slack, Gmail, etc.) through the connector gateway. Use `action:"discover"` to find the right tool slug, then `action:"execute"` with that `slug` and an `arguments` object to perform the action. Tool slugs are vendor-defined and case-sensitive; pass them exactly as listed.';

const STUB_NOTE =
    "The SaaS connector gateway is not configured in this environment, so no remote action was performed. Configure a connector (and authenticate the relevant toolkit) to enable these actions.";

/** Read the optional SaaS gateway handle from the deck context. */
function readGateway(ctx: DeckContext): SaasGatewayPort | undefined {
    const handle = ctx.framework?.[SAAS_GATEWAY_KEY];
    if (
        handle &&
        typeof (handle as SaasGatewayPort).discover === "function" &&
        typeof (handle as SaasGatewayPort).execute === "function"
    ) {
        return handle as SaasGatewayPort;
    }
    return undefined;
}

/**
 * Build the SaaS-action capability, adapting an injected gateway when present.
 *
 * @param ctx the deck context; an optional gateway is read from
 *            `ctx.framework[SAAS_GATEWAY_KEY]`.
 */
export function buildSaasCapability(ctx: DeckContext): Capability<typeof SaasParams, SaasDetails> {
    const gateway = readGateway(ctx);
    return {
        name: "saas-action",
        label: "SaaS action",
        description: SAAS_DESCRIPTION,
        parameters: SaasParams,
        async execute(_toolCallId, params) {
            if (!gateway) {
                return {
                    content: [{ type: "text", text: STUB_NOTE }],
                    details: { action: params.action, ok: false },
                    isError: true,
                };
            }
            if (params.action === "discover") {
                const tools = await gateway.discover({
                    toolkits: params.toolkits,
                    query: params.query,
                });
                const text =
                    tools.length === 0
                        ? "No remote tools matched."
                        : tools
                              .map((t) =>
                                  t.description ? `- ${t.slug} \u2014 ${t.description}` : `- ${t.slug}`,
                              )
                              .join("\n");
                return {
                    content: [{ type: "text", text }],
                    details: { action: "discover", ok: true, count: tools.length },
                };
            }
            if (!params.slug) {
                return {
                    content: [{ type: "text", text: "`slug` is required to execute a SaaS action." }],
                    details: { action: "execute", ok: false },
                    isError: true,
                };
            }
            const result = await gateway.execute(params.slug, params.arguments ?? {});
            return {
                content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
                details: { action: "execute", ok: result.ok, slug: params.slug },
                isError: result.ok ? undefined : true,
            };
        },
    };
}

/** Catalog row for the SaaS-action capability. */
export const saasCard: CapabilityCard = {
    id: capabilityId("saas-action"),
    title: "SaaS action",
    summary: "Discover and run third-party SaaS actions through the connector gateway.",
    // Erase the precisely-typed builder to the `Capability` card surface (through
    // `unknown`, as TypeBox tools are invariant in their parameter schema).
    build: (ctx) => buildSaasCapability(ctx),
};