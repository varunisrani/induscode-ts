/**
 * Built-in external-runtime catalog — the shipped {@link ExternalRuntimeSpec}
 * entries and the helper that *annotates* a model with one.
 */
import type { Api, Model } from "indusagi/ai";
import type { CatalogCard } from "../../conductor/catalog/index.js";
import {
  RUNTIME_ENDPOINT_SCHEME,
  type ExternalRuntimeSpec,
  type RuntimeAdapterId,
} from "../contract.js";

export const BUILTIN_RUNTIME_SPECS: Readonly<Record<RuntimeAdapterId, ExternalRuntimeSpec>> = {
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

export const BUILTIN_ADAPTERS: readonly RuntimeAdapterId[] = [
  "claude-cli",
  "codex-cli",
  "indusagi-cli",
];

export function builtinRuntimeSpec(adapter: RuntimeAdapterId): ExternalRuntimeSpec | undefined {
  return BUILTIN_RUNTIME_SPECS[adapter];
}

export interface RuntimeAnnotatedModel {
  readonly model: Model<Api>;
  readonly spec: ExternalRuntimeSpec;
}

export function withRuntimeEndpoint(model: Model<Api>, spec: ExternalRuntimeSpec): Model<Api> {
  return { ...model, baseUrl: `${RUNTIME_ENDPOINT_SCHEME}${spec.adapter}` };
}

export function annotateCard(
  card: CatalogCard,
  adapter: RuntimeAdapterId,
  spec?: ExternalRuntimeSpec,
): RuntimeAnnotatedModel | undefined {
  const resolved = spec ?? builtinRuntimeSpec(adapter);
  if (!resolved) return undefined;
  return { model: withRuntimeEndpoint(card.model, resolved), spec: resolved };
}

export function specFromModel(model: Model<Api>): ExternalRuntimeSpec | undefined {
  const baseUrl = model.baseUrl;
  if (!baseUrl.startsWith(RUNTIME_ENDPOINT_SCHEME)) return undefined;
  const adapter = baseUrl.slice(RUNTIME_ENDPOINT_SCHEME.length);
  return adapter.length > 0 ? builtinRuntimeSpec(adapter) : undefined;
}