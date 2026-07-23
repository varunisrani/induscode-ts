// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * RuntimeBroker — the single decision point that routes every turn to either an
 * external runtime (a spawned child coding-agent driven by a {@link RuntimeBridge})
 * or the framework network stream (`streamSimple` over an HTTP provider).
 *
 * The broker is the only component the product asks "how is this turn produced?".
 * It owns three concerns:
 *
 *   1. **Routing.** {@link RuntimeBroker.route} resolves the model's optional
 *      {@link ExternalRuntimeSpec} (a `bridge:<adapter>` baseUrl decode) and a
 *      matching registered {@link RuntimeBridge}. A model with a spec whose
 *      adapter is registered routes `"external"`; everything else routes
 *      `"framework"`.
 *   2. **Dispatch.** {@link RuntimeBrokerRuntime.exchange} acts on that decision:
 *      for an external route it builds (or is injected) a {@link ChildTransport}
 *      and calls {@link RuntimeBridge.runExchange} over it; for a framework route
 *      it calls the framework `streamSimple`. Either way it returns the framework
 *      {@link AssistantMessageEventStream} the turn streams into — the two paths
 *      are indistinguishable to the caller.
 *   3. **Resume persistence.** When a bridge surfaces a `resume` token (a CLI
 *      session id / thread id), the broker persists it through an injected
 *      {@link RuntimeLinkStore} as a *renamed* custom transcript entry —
 *      {@link RUNTIME_LINK_ENTRY} = `"external-runtime-link"`, shape
 *      `{ source, bridge, resumeToken, at }` — so a later exchange can reattach
 *      the same underlying session. Handle reuse keys on the composite
 *      {@link runtimeSourceKey} (`source|model|bridge`), not three separate field
 *      comparisons.
 *
 * The {@link ChildTransport} is injectable end to end: a production factory wraps
 * a spawned process, a test factory returns a hand-written fake. The broker never
 * imports `child_process`; nothing here spawns a real `claude`/`codex` binary.
 */
import type { Api, AssistantMessageEventStream, ChildTransport, Context, ExchangeOptions, ExternalRuntimeSpec, Model, NormalizedEvent, RuntimeBridge, RuntimeBroker } from "./contract";
/**
 * The custom transcript-entry tag under which a runtime resume token is logged.
 *
 * The record this build writes is its own `"external-runtime-link"` shape so the
 * persisted log carries no inherited vocabulary. A consumer scanning the active
 * branch backwards for a reattachable session matches on this tag.
 */
export declare const RUNTIME_LINK_ENTRY: "external-runtime-link";
/** The literal type of {@link RUNTIME_LINK_ENTRY}. */
export type RuntimeLinkEntryTag = typeof RUNTIME_LINK_ENTRY;
/**
 * The serializable payload persisted under {@link RUNTIME_LINK_ENTRY}.
 *
 * The renamed shape: `{ source, bridge, resumeToken, at }`. `source` is the
 * model's provider slug, `bridge` is the owning {@link RuntimeBridge.adapter},
 * `resumeToken` is the reattachable CLI session id / thread id the child
 * reported, and `at` is the ISO instant it was captured. Reuse keys on
 * {@link runtimeSourceKey}, derived from `source` + model id + `bridge`.
 */
export interface RuntimeLink {
    /** The model's provider slug (its `source`). */
    readonly source: string;
    /** The owning bridge adapter id. */
    readonly bridge: string;
    /** The reattachable session id / thread id reported by the child runtime. */
    readonly resumeToken: string;
    /** ISO-8601 instant the token was captured. */
    readonly at: string;
}
/**
 * Compose the composite reuse key a broker matches a persisted {@link RuntimeLink}
 * against. A single `source|model|bridge` string rather than three field
 * comparisons — a stored link is reattachable iff its key equals the key of the
 * exchange about to run.
 *
 * @param source the model provider slug
 * @param modelId the model id
 * @param bridge the bridge adapter id
 */
export declare function runtimeSourceKey(source: string, modelId: string, bridge: string): string;
/**
 * Injectable persistence boundary for resume tokens. The conductor's transcript
 * store binds a real implementation (appending a {@link RUNTIME_LINK_ENTRY} custom
 * entry to the active branch and scanning it backwards on lookup); tests pass an
 * in-memory fake. Both methods are async to match a disk-backed transcript.
 */
export interface RuntimeLinkStore {
    /**
     * Persist a captured resume token as a renamed custom transcript entry. Called
     * once per `resume` event a bridge surfaces during an exchange.
     *
     * @param link the renamed link record to append
     */
    save(link: RuntimeLink): Promise<void> | void;
    /**
     * Resolve the most recent reattachable token for a reuse key, or `undefined`
     * when the active branch holds no matching {@link RUNTIME_LINK_ENTRY}. The key
     * is {@link runtimeSourceKey}.
     *
     * @param sourceKey the composite `source|model|bridge` reuse key
     */
    find(sourceKey: string): Promise<string | undefined> | string | undefined;
}
/**
 * The context handed to a {@link ChildTransportFactory} when the broker needs a
 * transport for an external exchange. Carries everything a production factory
 * needs to launch + wire the child (the resolved spec's binary/args/env, the
 * working directory, a resume token to reattach) without the broker itself
 * touching `child_process`.
 */
export interface TransportContext {
    /** The resolved runtime spec (binary, args, env, delegate) for the child. */
    readonly spec: ExternalRuntimeSpec;
    /** The bound model the exchange runs for. */
    readonly model: Model<Api>;
    /** The per-exchange options (session id, cwd, resume, stream opts). */
    readonly opts: ExchangeOptions;
    /** A persisted resume token resolved for this exchange, if any. */
    readonly resume?: string;
}
/**
 * Mints a {@link ChildTransport} for an external exchange. The single seam the
 * broker reaches the outside world through: a production factory spawns the
 * process and adapts its stdio/RPC into the transport; a test factory returns a
 * scripted fake. The broker calls it lazily, only on an external route.
 */
export type ChildTransportFactory = (ctx: TransportContext) => ChildTransport;
/** The framework network-stream signature the broker falls through to. */
export type FrameworkStream = (model: Model<Api>, context: Context, opts: ExchangeOptions) => AssistantMessageEventStream;
/**
 * Construction-time dependencies for {@link createRuntimeBroker}. All optional —
 * an empty broker registers bridges later, routes everything to the framework
 * until a transport factory is wired, and skips persistence when no store is set.
 */
export interface RuntimeBrokerDeps {
    /**
     * The seam that builds a {@link ChildTransport} for an external exchange. When
     * absent, an external route still *decides* `"external"` but {@link
     * RuntimeBrokerRuntime.exchange} cannot drive a child — so it falls through to
     * the framework path. Tests inject a fake-transport factory here.
     */
    readonly transportFactory?: ChildTransportFactory;
    /** Where resume tokens persist; omitted ⇒ tokens are not persisted. */
    readonly linkStore?: RuntimeLinkStore;
    /**
     * Override for the framework network stream (defaults to `streamSimple`).
     * Injected in tests so the framework path is observable without a network.
     */
    readonly frameworkStream?: FrameworkStream;
    /** Bridges to pre-register at construction (equivalent to calling `register`). */
    readonly bridges?: readonly RuntimeBridge[];
}
/**
 * The broker the product drives. Extends the frozen {@link RuntimeBroker} routing
 * surface with {@link exchange}: the dispatch half that acts on a {@link route}
 * decision and returns the framework stream the turn streams into.
 */
export interface RuntimeBrokerRuntime extends RuntimeBroker {
    /**
     * Produce the turn for `model`. Routes (via {@link RuntimeBroker.route}); on an
     * `"external"` route with a wired transport factory it drives the bridge's
     * `runExchange` over a freshly-built {@link ChildTransport} (resolving + later
     * persisting the resume token); otherwise it runs the framework stream. Returns
     * the {@link AssistantMessageEventStream} synchronously, like `streamSimple`.
     *
     * @param model   the model the turn is bound to
     * @param context the framework conversation context
     * @param opts    per-exchange options
     */
    exchange(model: Model<Api>, context: Context, opts?: ExchangeOptions): AssistantMessageEventStream;
}
/**
 * Construct a {@link RuntimeBrokerRuntime}. The single sanctioned way to obtain a
 * broker: build one with optional dependencies (a transport factory, a resume
 * link store, a framework-stream override, pre-registered bridges), then
 * {@link RuntimeBroker.register} further bridges and drive turns through
 * {@link RuntimeBrokerRuntime.exchange} / {@link RuntimeBroker.route}.
 *
 * @param deps optional construction-time dependencies
 */
export declare function createRuntimeBroker(deps?: RuntimeBrokerDeps): RuntimeBrokerRuntime;
/**
 * The normalized resume-event kind a bridge emits — re-exported so a transport
 * tap / consumer can name the same `"resume"` discriminant the sink ignores on
 * the stream but the broker persists out of band.
 */
export type ResumeEvent = Extract<NormalizedEvent, {
    kind: "resume";
}>;
