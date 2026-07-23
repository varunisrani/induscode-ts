// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * AddonHost — the assembly point that turns a directory of addon modules into a
 * single wired runtime.
 *
 * This is the top of the addons subsystem: it composes the injectable
 * {@link ModuleLoader} (discovery + load), the per-addon {@link AddonSurface}
 * recorder, the {@link EventDispatcher} (observe / transform / gate), and the
 * {@link InterceptorChain} (tool-boundary enter / exit) into one coherent host.
 * Its job is purely *folding*: read every addon's recorded
 * {@link RegisteredManifest} back out and merge the four contribution streams
 * into one shared registry, then build the dispatch + interception runtimes over
 * the merged subscriptions and interceptors.
 *
 * The load pipeline, per discovered source:
 *
 *   1. **Load.** Resolve the source path through the injected loader into an
 *      {@link AddonManifest}. A load failure is isolated into an
 *      {@link AddonFault} (`kind: "load"`) and the source is skipped — one broken
 *      addon never aborts the others.
 *   2. **Register.** Mint a fresh surface scoped to the addon's id and the
 *      host's {@link FrameworkHandles}, then invoke the addon's `register` against
 *      it. A throw is isolated as a `register` fault and the addon contributes
 *      nothing.
 *   3. **Fold.** Read the surface's {@link RegisteredManifest} and merge its
 *      subscriptions / interceptors / commands / tools into the host's growing
 *      registry. Registration order is preserved across addons, so the
 *      dispatcher's middleware order and the chain's onion order equal load order.
 *      A command or tool whose name is already claimed — by another addon or by a
 *      reserved host action — is rejected as a `conflict` fault and dropped; the
 *      first claimant wins.
 *
 * After {@link AddonHost.loadAll} resolves, the host exposes:
 *   - {@link AddonHost.dispatch} — the bound {@link EventDispatcher} over every
 *     addon's subscriptions;
 *   - {@link AddonHost.interceptors} — the {@link InterceptorChain} over every
 *     addon's tool interceptors;
 *   - {@link AddonHost.commands} / {@link AddonHost.tools} — the collected,
 *     conflict-resolved capabilities;
 *   - {@link AddonHost.onFault} — a single fault stream fanning out load /
 *     register / conflict faults plus the runtime handler faults the dispatcher
 *     and chain raise.
 *
 * The loader stays **injectable**: {@link AddonHostDeps.loader} defaults to the
 * jiti-backed {@link createJitiLoader}, but a test injects a scripted fake that
 * returns manifests with no real jiti and no disk — the host code only ever sees
 * the {@link ModuleLoader} interface.
 */
import { type AddonCommand, type AddonDiscovery, type AddonFaultListener, type AddonId, type AddonSource, type AddonTool, type EventDispatcher, type EventSubscription, type FrameworkHandles, type InterceptorChain, type ModuleLoader, type ToolInterceptor } from "./contract";
/**
 * The injectable collaborators an {@link AddonHost} is built from.
 *
 * Every field is optional with a live default, so production code calls
 * {@link createAddonHost} with nothing (or just {@link AddonHostDeps.handles})
 * and a test overrides exactly the seam it needs — almost always
 * {@link AddonHostDeps.loader} with a scripted fake.
 */
export interface AddonHostDeps {
    /**
     * The module loader turning a source path into an {@link AddonManifest}.
     * Defaults to the jiti-backed {@link createJitiLoader}; a test injects a fake.
     */
    readonly loader?: ModuleLoader;
    /**
     * The framework handles threaded into every addon's surface and command
     * context. Defaults to an empty bag (a non-interactive run supplies fewer than
     * an interactive TUI).
     */
    readonly handles?: FrameworkHandles;
    /**
     * Override how the {@link EventDispatcher} is built from the folded
     * subscriptions. Defaults to {@link AddonEventDispatcher.from}; injectable so a
     * test can substitute a custom dispatcher.
     */
    readonly dispatcher?: (subscriptions: readonly EventSubscription[]) => EventDispatcher;
    /**
     * Override how the {@link InterceptorChain} is built from the folded
     * interceptors. Defaults to {@link AddonInterceptorChain.from}.
     */
    readonly chain?: (interceptors: readonly ToolInterceptor[]) => InterceptorChain;
    /**
     * The reserved core action names addon commands may not shadow. Defaults to
     * {@link RESERVED_ACTION_NAMES}; injectable so a host with a different core
     * command set can supply its own.
     */
    readonly reservedActions?: Iterable<string>;
}
/**
 * The merged, conflict-resolved registry the host accumulates while folding
 * every addon's {@link RegisteredManifest}.
 *
 * One flat list per contribution stream, in load order. The host builds the
 * dispatch and interception runtimes from {@link AddonRegistry.subscriptions} and
 * {@link AddonRegistry.interceptors}; {@link AddonRegistry.commands} and
 * {@link AddonRegistry.tools} are the collected capabilities, already de-duped
 * against earlier claimants and the reserved set.
 */
export interface AddonRegistry {
    /** Every addon's event subscriptions, in load (registration) order. */
    readonly subscriptions: readonly EventSubscription[];
    /** Every addon's tool interceptors, in load order. */
    readonly interceptors: readonly ToolInterceptor[];
    /** The collected, name-deduped slash commands. */
    readonly commands: readonly AddonCommand[];
    /** The collected, name-deduped contributed tools. */
    readonly tools: readonly AddonTool[];
}
/**
 * The fully-wired addon runtime {@link AddonHost.loadAll} produces.
 *
 * Exposes the dispatch engine, the interceptor chain, the collected
 * capabilities, the loaded source manifests (for diagnostics/listing), and a
 * single fault stream. Consumers wire {@link dispatch} into the agent's event
 * points, {@link interceptors} into the tool boundary, and surface
 * {@link commands} / {@link tools} into the session.
 */
export interface AddonSurfaceBundle {
    /** The event dispatcher over every loaded addon's subscriptions. */
    readonly dispatch: EventDispatcher;
    /** The tool-boundary chain over every loaded addon's interceptors. */
    readonly interceptors: InterceptorChain;
    /** The collected, conflict-resolved slash commands. */
    readonly commands: readonly AddonCommand[];
    /** The collected, conflict-resolved contributed tools. */
    readonly tools: readonly AddonTool[];
    /** The ids of the addons that loaded and registered successfully, in order. */
    readonly loaded: readonly AddonId[];
}
/**
 * The addon host: discovers, loads, registers, and folds addons into a single
 * wired runtime.
 *
 * Build one with {@link createAddonHost} (defaults wire the live runtime). Call
 * {@link loadAll} once with a discovery directory (or pass an explicit
 * {@link AddonDiscovery}) to populate the host, then read {@link dispatch},
 * {@link interceptors}, {@link commands}, and {@link tools}. Faults raised during
 * loading — and the runtime handler faults the dispatcher/chain raise — fan out
 * to {@link onFault} listeners.
 */
export declare class AddonHost {
    /** Live set of fault listeners, in registration order. */
    private readonly faultListeners;
    /** The reserved core action names addon commands may not shadow. */
    private readonly reserved;
    /** Accumulated subscriptions across every folded addon, in load order. */
    private readonly subscriptions;
    /** Accumulated interceptors across every folded addon, in load order. */
    private readonly interceptors;
    /** Accumulated, name-deduped commands. */
    private readonly commands;
    /** Accumulated, name-deduped tools. */
    private readonly tools;
    /** The command names already claimed (reserved + earlier addon commands). */
    private readonly claimedCommands;
    /** The tool names already claimed by earlier addons. */
    private readonly claimedTools;
    /** The ids of addons that loaded and registered successfully, in order. */
    private readonly loaded;
    private readonly loader;
    private readonly handles;
    private readonly buildDispatcher;
    private readonly buildChain;
    /**
     * @param deps the injectable collaborators (loader, handles, dispatcher/chain
     *   factories, reserved action names) — each with a live default
     */
    constructor(deps?: AddonHostDeps);
    /**
     * Register a listener for every {@link AddonFault} the host raises — load,
     * register, and conflict faults during folding, plus the runtime handler faults
     * the built dispatcher and chain route. Returns an idempotent unsubscribe.
     *
     * Registering before {@link loadAll} captures load-time faults; the dispatcher
     * and chain built by {@link loadAll} are wired to this same sink so a later
     * dispatch fault reaches the same listeners.
     *
     * @param listener the fault sink
     */
    onFault(listener: AddonFaultListener): () => void;
    /**
     * Discover, load, register, and fold every addon under a directory (or a full
     * {@link AddonDiscovery} config), then build and return the wired runtime.
     *
     * A bare string is treated as the workspace whose `.indus/addons` directory is
     * scanned; an {@link AddonDiscovery} is passed through to {@link discoverSources}
     * unchanged. Each discovered source is loaded through the injected loader and
     * folded; failures are isolated into faults. The returned
     * {@link AddonSurfaceBundle} exposes the dispatch engine, the interceptor chain,
     * and the collected capabilities — all wired to this host's fault stream.
     *
     * @param where a workspace path, or a full discovery config
     */
    loadAll(where: string | AddonDiscovery): Promise<AddonSurfaceBundle>;
    /**
     * Load, register, and fold a single already-discovered {@link AddonSource}.
     *
     * Public so a host can graft an explicitly-resolved addon (e.g. an
     * always-on bundled addon) without going through directory discovery. Isolates
     * load and register failures into faults and folds whatever the addon recorded.
     *
     * @param source the discovered source (id + entry path)
     */
    loadOne(source: AddonSource): Promise<void>;
    /**
     * Build the {@link AddonSurfaceBundle} from the current accumulated registry.
     *
     * The dispatcher and chain are constructed via the injected factories over the
     * folded subscriptions/interceptors and wired to this host's fault stream, so
     * runtime handler faults reach the same listeners as load-time faults.
     */
    private bundle;
    /** The merged, conflict-resolved registry accumulated so far. */
    get registry(): AddonRegistry;
    /**
     * Fold one addon's recorded {@link RegisteredManifest} into the host registry.
     *
     * Subscriptions and interceptors are appended unconditionally (order = load
     * order). Commands and tools are name-checked against the claimed sets: a name
     * already taken (by the reserved set or an earlier addon) is rejected as a
     * `conflict` fault and dropped, so the first claimant wins.
     */
    private fold;
    /**
     * Forward a built runtime's fault stream into the host's listeners, when the
     * runtime exposes one.
     *
     * The contract's {@link EventDispatcher} always declares `onFault`; the
     * {@link InterceptorChain} interface does not, though the default
     * {@link AddonInterceptorChain} provides it. This probes for the method so an
     * injected dispatcher/chain that omits a fault stream is simply not wired,
     * rather than failing the host.
     */
    private wireFaults;
    /** Route a fault to every listener, guarding each listener against its own throw. */
    private report;
}
/**
 * Construct an {@link AddonHost} with the given (all-optional) dependencies.
 *
 * The single sanctioned entry point: production code calls it with nothing (or
 * just {@link AddonHostDeps.handles}) and gets the jiti-backed loader and the
 * default dispatcher/chain factories; a test injects a fake {@link ModuleLoader}
 * to exercise the full fold-and-wire pipeline with no real jiti or disk.
 *
 * @param deps the injectable collaborators (loader, handles, factories, reserved)
 */
export declare function createAddonHost(deps?: AddonHostDeps): AddonHost;
