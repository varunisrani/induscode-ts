/**
 * RuntimeBroker — the single decision point that routes every turn to either an
 * external runtime or the framework network stream.
 */
import { streamSimple } from "indusagi/ai";
import type {
  Api,
  AssistantMessageEventStream,
  ChildTransport,
  Context,
  ExchangeOptions,
  ExternalRuntimeSpec,
  Model,
  NormalizedEvent,
  RuntimeBridge,
  RuntimeBroker,
} from "./contract.js";

export const RUNTIME_LINK_ENTRY = "external-runtime-link" as const;
export type RuntimeLinkEntryTag = typeof RUNTIME_LINK_ENTRY;

export interface RuntimeLink {
  readonly source: string;
  readonly bridge: string;
  readonly resumeToken: string;
  readonly at: string;
}

export function runtimeSourceKey(source: string, modelId: string, bridge: string): string {
  return `${source}|${modelId}|${bridge}`;
}

export interface RuntimeLinkStore {
  save(link: RuntimeLink): Promise<void> | void;
  find(sourceKey: string): Promise<string | undefined> | string | undefined;
}

export interface TransportContext {
  readonly spec: ExternalRuntimeSpec;
  readonly model: Model<Api>;
  readonly opts: ExchangeOptions;
  readonly resume?: string;
}

export type ChildTransportFactory = (ctx: TransportContext) => ChildTransport;

export type FrameworkStream = (
  model: Model<Api>,
  context: Context,
  opts: ExchangeOptions,
) => AssistantMessageEventStream;

export interface RuntimeBrokerDeps {
  readonly transportFactory?: ChildTransportFactory;
  readonly linkStore?: RuntimeLinkStore;
  readonly frameworkStream?: FrameworkStream;
  readonly bridges?: readonly RuntimeBridge[];
}

export interface RuntimeBrokerRuntime extends RuntimeBroker {
  exchange(
    model: Model<Api>,
    context: Context,
    opts?: ExchangeOptions,
  ): AssistantMessageEventStream;
}

export type ResumeEvent = Extract<NormalizedEvent, { kind: "resume" }>;

function resumeTokenOf(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const rec = payload as Record<string, unknown>;
  if (rec["method"] === "session/resume") {
    const params = rec["params"];
    if (typeof params === "object" && params !== null) {
      const t = (params as Record<string, unknown>)["resumeToken"];
      if (typeof t === "string") return t;
    }
    return undefined;
  }
  if (rec["type"] === "system" && rec["subtype"] === "init") {
    const id = rec["session_id"];
    if (typeof id === "string") return id;
  }
  if (rec["type"] === "thread.started") {
    const id = rec["thread_id"];
    if (typeof id === "string") return id;
  }
  return undefined;
}

interface ResumeTap {
  onMessage: (m: { payload: unknown }) => void;
  onClose: (disposer: () => void) => void;
}

function makeResumeTap(
  store: RuntimeLinkStore | undefined,
  source: string,
  modelId: string,
  bridge: string,
): ResumeTap | undefined {
  if (!store) return undefined;
  let saved = false;
  let disposer: (() => void) | undefined;
  const persist = (resumeToken: string): void => {
    if (saved) return;
    saved = true;
    const link: RuntimeLink = {
      source,
      bridge,
      resumeToken,
      at: new Date().toISOString(),
    };
    try {
      const r = store.save(link);
      if (r && typeof (r as Promise<void>).catch === "function") {
        (r as Promise<void>).catch(() => undefined);
      }
    } catch {
      /* ignore persistence failures */
    }
    disposer?.();
  };
  return {
    onMessage: (m): void => {
      const token = resumeTokenOf(m.payload);
      if (token !== undefined) persist(token);
    },
    onClose: (d): void => {
      disposer = d;
    },
  };
}

class Broker implements RuntimeBrokerRuntime {
  readonly #bridges: Map<string, RuntimeBridge> = new Map();
  readonly #transportFactory: ChildTransportFactory | undefined;
  readonly #linkStore: RuntimeLinkStore | undefined;
  readonly #framework: FrameworkStream;
  readonly #knownSpecs: Readonly<Record<string, ExternalRuntimeSpec>> = {
    "claude-cli": {
      adapter: "claude-cli",
      authMode: "external-cli",
      binaryPath: "claude",
      args: ["--output-format", "stream-json", "--verbose"],
    },
    "codex-cli": {
      adapter: "codex-cli",
      authMode: "external-cli",
      binaryPath: "codex",
      args: ["--json"],
    },
    "indusagi-cli": {
      adapter: "indusagi-cli",
      authMode: "external-cli",
      binaryPath: "indusagi",
      args: ["--rpc"],
    },
  };

  constructor(deps: RuntimeBrokerDeps = {}) {
    this.#transportFactory = deps.transportFactory;
    this.#linkStore = deps.linkStore;
    this.#framework = deps.frameworkStream ?? ((model, context, opts) => streamSimple(model, context, opts));
    for (const bridge of deps.bridges ?? []) this.register(bridge);
  }

  register(bridge: RuntimeBridge): void {
    this.#bridges.set(bridge.adapter, bridge);
  }

  resolveSpec(model: Model<Api>): ExternalRuntimeSpec | undefined {
    const baseUrl = model.baseUrl;
    if (!baseUrl.startsWith("bridge:")) return undefined;
    const adapter = baseUrl.slice("bridge:".length);
    if (!this.#bridges.has(adapter)) return undefined;
    return this.#knownSpecs[adapter];
  }

  requiresCredential(spec: ExternalRuntimeSpec): boolean {
    const bridge = this.#bridges.get(spec.adapter);
    return bridge ? bridge.requiresCredential(spec) : spec.authMode === "api-key";
  }

  route(model: Model<Api>, _context: Context, _opts: ExchangeOptions): { target: "external"; bridge: RuntimeBridge; spec: ExternalRuntimeSpec } | { target: "framework" } {
    const spec = this.resolveSpec(model);
    if (!spec) return { target: "framework" };
    const bridge = this.#bridges.get(spec.adapter);
    if (!bridge) return { target: "framework" };
    return { target: "external", bridge, spec };
  }

  exchange(model: Model<Api>, context: Context, opts: ExchangeOptions = {}): AssistantMessageEventStream {
    const baseUrl = model.baseUrl;
    const adapter = baseUrl.startsWith("bridge:") ? baseUrl.slice("bridge:".length) : undefined;
    const spec = adapter ? this.resolveSpec(model) : undefined;
    const bridge = spec ? this.#bridges.get(spec.adapter) : undefined;
    if (!spec || !bridge) {
      return this.#framework(model, context, opts);
    }
    if (!this.#transportFactory) {
      return this.#framework(model, context, opts);
    }
    const source = String(model.provider);
    const sourceKey = runtimeSourceKey(source, model.id, spec.adapter);
    const persisted = this.#linkStore?.find(sourceKey);
    const resume = typeof persisted === "string" ? persisted : opts.resume;
    const exchangeOpts: ExchangeOptions = resume !== undefined ? { ...opts, resume } : opts;
    const transport = this.#transportFactory({
      spec,
      model,
      opts: exchangeOpts,
      ...(resume !== undefined ? { resume } : {}),
    });
    const tap = makeResumeTap(this.#linkStore, source, model.id, spec.adapter);
    if (tap) {
      const dispose = transport.onMessage(tap.onMessage);
      tap.onClose(dispose);
    }
    return bridge.runExchange(model, context, exchangeOpts, transport);
  }
}

export function createRuntimeBroker(deps: RuntimeBrokerDeps = {}): RuntimeBrokerRuntime {
  return new Broker(deps);
}