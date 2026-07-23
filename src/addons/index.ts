// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Addons subsystem — public barrel.
 *
 * Re-exports the FROZEN third-party customization contract: the
 * {@link AddonManifest} an addon module returns and the {@link AddonSurface} its
 * `register` entry point receives, the colon-named {@link HookEvent} taxonomy
 * with its observe/transform/gate {@link HookHandler} middleware and the
 * {@link EventDispatcher} that runs them, the tool-boundary {@link ToolInterceptor}
 * stages and the {@link InterceptorChain} pipeline that folds them around a tool
 * execution, the capabilities an addon contributes ({@link AddonTool},
 * {@link AddonCommand}), the injectable {@link ModuleLoader} + {@link AddonDiscovery}
 * loading seam, and the typed {@link AddonFault}.
 *
 * Behavior modules (the jiti-backed sandbox loader, the capability registry, the
 * surface builder, the event dispatcher, and the interceptor chain) are added to
 * this barrel as they land; consumers import the addon surface from
 * `src/addons` rather than reaching into individual modules.
 */
export type { BundledNamespace, AddonId, AddonManifest, RegisteredManifest, HookEvent, HookKind, GateDecision, HookHandler, EventSubscription, EventDispatcher, DispatchOutcome, ToolEnterContext, ToolExitContext, EnterOutcome, ExitOutcome, ToolInterceptor, InterceptorChain, InterceptResult, AddonTool, CommandContext, AddonCommand, FrameworkHandles, ExecOutcome, AddonSurface, ModuleLoader, AddonDiscovery, AddonSource, AddonFaultKind, AddonFault, AddonFaultListener, AgentMessage, AgentTool, AgentToolResult, ThinkingLevel, Model, Component, KeyId, TSchema, Static, } from "./contract";
export { BUNDLED_NAMESPACES, ADDONS_DIR, ADDON_MANIFEST_FIELD, addonId, emptyManifest, addonFault, } from "./contract";
/**
 * Addon sandbox — the single jiti-backed {@link ModuleLoader}: bridges the
 * framework {@link BUNDLED_NAMESPACES} into a loaded addon (virtual modules in a
 * compiled binary, resolved aliases under Node) and turns a path into its
 * {@link AddonManifest}. Injectable — tests supply a fake of the same interface.
 */
export { createJitiLoader, scrubInvisible, expandPath, resolvePath, type JitiLoaderOptions, } from "./sandbox";
/**
 * Addon discovery — scan a `.indus/addons` directory for entry modules and fold
 * an {@link AddonDiscovery} config into id-stamped {@link AddonSource}s.
 */
export { discoverAddons, discoverSources } from "./manifest";
/**
 * Dispatch runtime — the unified {@link EventDispatcher} (observe / transform /
 * gate) and the tool-boundary {@link InterceptorChain}, plus the `subscription`
 * and `interceptor` minters for assembling their recorded shapes by hand.
 */
export { AddonEventDispatcher, AddonInterceptorChain, subscription, interceptor, } from "./dispatch/index";
/**
 * Addon surface — the per-addon recording {@link AddonSurface} the host hands to
 * an addon's `register`; accumulates contributions and reads them back as a
 * {@link RegisteredManifest}.
 */
export { createSurface } from "./surface";
/**
 * Addon host — the assembly point: discover + load (injectable loader), register
 * each addon against a fresh surface, fold every {@link RegisteredManifest} into
 * one registry, and wire the dispatch engine + interceptor chain + collected
 * commands/tools.
 */
export { createAddonHost, AddonHost, type AddonHostDeps, type AddonRegistry, type AddonSurfaceBundle, } from "./host";
