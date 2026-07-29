/**
 * AddonHost — the assembly point that turns a directory of addon modules into a
 * single wired runtime.
 */
import {
  addonFault,
  addonId,
  type AddonCommand,
  type AddonDiscovery,
  type AddonFault,
  type AddonFaultListener,
  type AddonId,
  type AddonSource,
  type AddonTool,
  type EventDispatcher,
  type EventSubscription,
  type FrameworkHandles,
  type InterceptorChain,
  type ModuleLoader,
  type RegisteredManifest,
  type ToolInterceptor,
} from "./contract.js";
import { AddonEventDispatcher } from "./dispatch/event-dispatcher.js";
import { AddonInterceptorChain } from "./dispatch/tool-interceptor.js";
import { discoverSources } from "./manifest.js";
import { createJitiLoader } from "./sandbox.js";
import { createSurface } from "./surface.js";

export interface AddonHostDeps {
  readonly loader?: ModuleLoader;
  readonly handles?: FrameworkHandles;
  readonly dispatcher?: (subscriptions: readonly EventSubscription[]) => EventDispatcher;
  readonly chain?: (interceptors: readonly ToolInterceptor[]) => InterceptorChain;
  readonly reservedActions?: Iterable<string>;
}

export interface AddonRegistry {
  readonly subscriptions: readonly EventSubscription[];
  readonly interceptors: readonly ToolInterceptor[];
  readonly commands: readonly AddonCommand[];
  readonly tools: readonly AddonTool[];
}

export interface AddonSurfaceBundle {
  readonly dispatch: EventDispatcher;
  readonly interceptors: InterceptorChain;
  readonly commands: readonly AddonCommand[];
  readonly tools: readonly AddonTool[];
  readonly loaded: readonly AddonId[];
}

const RESERVED_ACTION_NAMES: ReadonlySet<string> = new Set([
  "help",
  "quit",
  "exit",
  "clear",
  "model",
  "compact",
]);

export class AddonHost {
  private readonly faultListeners: Set<AddonFaultListener> = new Set();
  private readonly reserved: Set<string>;
  private readonly subscriptions: EventSubscription[] = [];
  private readonly interceptors: ToolInterceptor[] = [];
  private readonly commands: AddonCommand[] = [];
  private readonly tools: AddonTool[] = [];
  private readonly claimedCommands: Set<string>;
  private readonly claimedTools: Set<string> = new Set();
  private readonly loaded: AddonId[] = [];
  private readonly loader: ModuleLoader;
  private readonly handles: FrameworkHandles;
  private readonly buildDispatcher: (
    subs: readonly EventSubscription[],
  ) => EventDispatcher;
  private readonly buildChain: (interceptors: readonly ToolInterceptor[]) => InterceptorChain;

  constructor(deps: AddonHostDeps = {}) {
    this.loader = deps.loader ?? createJitiLoader();
    this.handles = deps.handles ?? {};
    this.buildDispatcher =
      deps.dispatcher ?? ((subs) => AddonEventDispatcher.from(subs));
    this.buildChain = deps.chain ?? ((stages) => AddonInterceptorChain.from(stages));
    this.reserved =
      deps.reservedActions === undefined
        ? new Set(RESERVED_ACTION_NAMES)
        : new Set(deps.reservedActions);
    this.claimedCommands = new Set(this.reserved);
  }

  onFault(listener: AddonFaultListener): () => void {
    this.faultListeners.add(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.faultListeners.delete(listener);
    };
  }

  async loadAll(where: string | AddonDiscovery): Promise<AddonSurfaceBundle> {
    const discovery = typeof where === "string" ? { workspace: where } : where;
    const sources = discoverSources(discovery);
    for (const source of sources) {
      await this.loadOne(source);
    }
    return this.bundle();
  }

  async loadOne(source: AddonSource): Promise<void> {
    let module;
    try {
      module = await this.loader.load(source.path);
    } catch (cause) {
      this.report(
        addonFault("load", `Failed to load addon at ${source.path}.`, {
          addon: source.id,
          cause,
        }),
      );
      return;
    }
    const id = module.id !== undefined ? addonId(module.id) : source.id;
    const surface = createSurface(id, this.handles, module.version);
    try {
      await module.register(surface);
    } catch (cause) {
      this.report(
        addonFault("register", `Addon "${id}" threw during register().`, {
          addon: id,
          cause,
        }),
      );
      return;
    }
    this.fold(id, surface.manifest());
    this.loaded.push(id);
  }

  private bundle(): AddonSurfaceBundle {
    const dispatch = this.buildDispatcher(this.subscriptions);
    const interceptors = this.buildChain(this.interceptors);
    this.wireFaults(dispatch);
    this.wireFaults(interceptors);
    return {
      dispatch,
      interceptors,
      commands: [...this.commands],
      tools: [...this.tools],
      loaded: [...this.loaded],
    };
  }

  get registry(): AddonRegistry {
    return {
      subscriptions: [...this.subscriptions],
      interceptors: [...this.interceptors],
      commands: [...this.commands],
      tools: [...this.tools],
    };
  }

  private fold(addon: AddonId, manifest: RegisteredManifest): void {
    for (const sub of manifest.subscriptions) {
      this.subscriptions.push(sub);
    }
    for (const stage of manifest.interceptors) {
      this.interceptors.push(stage);
    }
    for (const command of manifest.commands) {
      if (this.claimedCommands.has(command.name)) {
        this.report(
          addonFault(
            "conflict",
            this.reserved.has(command.name)
              ? `Addon "${addon}" command "${command.name}" is a reserved action name.`
              : `Addon "${addon}" command "${command.name}" conflicts with an already-registered command.`,
            { addon },
          ),
        );
        continue;
      }
      this.claimedCommands.add(command.name);
      this.commands.push(command);
    }
    for (const tool of manifest.tools) {
      if (this.claimedTools.has(tool.name)) {
        this.report(
          addonFault(
            "conflict",
            `Addon "${addon}" tool "${tool.name}" conflicts with an already-registered tool.`,
            { addon },
          ),
        );
        continue;
      }
      this.claimedTools.add(tool.name);
      this.tools.push(tool);
    }
  }

  private wireFaults(source: { onFault?: (listener: AddonFaultListener) => unknown }): void {
    const onFault = source.onFault;
    if (typeof onFault === "function") {
      onFault.call(source, (fault: AddonFault) => this.report(fault));
    }
  }

  private report(fault: AddonFault): void {
    for (const listener of [...this.faultListeners]) {
      try {
        listener(fault);
      } catch {
        /* ignore listener errors */
      }
    }
  }
}

/**
 * Construct an {@link AddonHost} with the given (all-optional) dependencies.
 */
export function createAddonHost(deps: AddonHostDeps = {}): AddonHost {
  return new AddonHost(deps);
}