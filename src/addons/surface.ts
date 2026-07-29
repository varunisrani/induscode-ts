/**
 * AddonSurface implementation — the recording registration API.
 */
import type {
  AddonCommand,
  AddonId,
  AddonSurface,
  AddonTool,
  EventSubscription,
  FrameworkHandles,
  HookEvent,
  HookHandler,
  RegisteredManifest,
  ToolInterceptor,
} from "./contract.js";

class RecordingSurface implements AddonSurface {
  readonly id: AddonId;
  readonly handles: FrameworkHandles;
  readonly version: string | undefined;
  readonly subscriptions: EventSubscription[] = [];
  readonly interceptors: ToolInterceptor[] = [];
  readonly commands: AddonCommand[] = [];
  readonly tools: AddonTool[] = [];

  constructor(id: AddonId, handles: FrameworkHandles, version?: string) {
    this.id = id;
    this.handles = handles;
    this.version = version;
  }

  on<TPayload>(event: HookEvent, handler: HookHandler<TPayload>): void {
    this.subscriptions.push({
      event,
      handler: handler as HookHandler,
      addon: this.id,
    });
  }

  interceptTool(
    name: string | "*",
    interceptor: Omit<ToolInterceptor, "match" | "addon">,
  ): void {
    this.interceptors.push({ ...interceptor, match: name, addon: this.id });
  }

  addCommand(name: string, handler: Omit<AddonCommand, "name" | "addon">): void {
    this.commands.push({ ...handler, name, addon: this.id });
  }

  addTool(card: AddonTool): void {
    this.tools.push(card);
  }

  manifest(): RegisteredManifest {
    const base = {
      addon: this.id,
      subscriptions: Object.freeze([...this.subscriptions]),
      interceptors: Object.freeze([...this.interceptors]),
      commands: Object.freeze([...this.commands]),
      tools: Object.freeze([...this.tools]),
    };
    return Object.freeze(
      this.version === undefined ? base : { ...base, version: this.version },
    );
  }
}

/**
 * Mint a fresh {@link AddonSurface} for one addon.
 */
export function createSurface(
  id: AddonId,
  handles: FrameworkHandles,
  version?: string,
): AddonSurface {
  return new RecordingSurface(id, handles, version);
}