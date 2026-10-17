import { ModelRegistry, type Api, type Model } from "indusagi/ai";

export type AstraReasoningLevel = "low" | "medium" | "high" | "xhigh" | "max";

export interface LongContextPricing {
  readonly threshold: number;
  readonly multipliers: {
    readonly input: number;
    readonly cacheRead: number;
    readonly cacheWrite: number;
    readonly output: number;
  };
}

export interface CodingAgentModel<TApi extends Api = Api> extends Model<TApi> {
  readonly reasoningEfforts?: readonly AstraReasoningLevel[];
  readonly longContextPricing?: LongContextPricing;
}

const GPT_6_ASTRA_BASE = {
  id: "gpt-6-astra",
  name: "GPT-6 Astra",
  api: "openai-responses",
  reasoning: true,
  reasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  input: ["text", "image"] as Array<"text" | "image">,
  cost: {
    input: 10,
    cacheRead: 1,
    cacheWrite: 12.5,
    output: 50,
  },
  contextWindow: 1_050_000,
  maxTokens: 128_000,
  longContextPricing: {
    threshold: 272_000,
    multipliers: {
      input: 2,
      cacheRead: 2,
      cacheWrite: 2,
      output: 1.5,
    },
  },
} as const;

const GPT_6_SOL_BASE = {
  id: "gpt-6-sol",
  name: "GPT-6 Sol",
  api: "openai-responses",
  reasoning: true,
  reasoningEfforts: ["high"],
  input: ["text", "image"] as Array<"text" | "image">,
  cost: {
    input: 10,
    cacheRead: 1,
    cacheWrite: 12.5,
    output: 50,
  },
  contextWindow: 1_050_000,
  maxTokens: 128_000,
  longContextPricing: {
    threshold: 272_000,
    multipliers: {
      input: 2,
      cacheRead: 2,
      cacheWrite: 2,
      output: 1.5,
    },
  },
} as const;

const GPT_6_LUNA_BASE = {
  id: "gpt-6-luna",
  name: "GPT-6 Luna",
  api: "openai-responses",
  reasoning: true,
  reasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  input: ["text", "image"] as Array<"text" | "image">,
  cost: {
    input: 0.1,
    cacheRead: 0.01,
    cacheWrite: 0.125,
    output: 0.5,
  },
  contextWindow: 1_050_000,
  maxTokens: 128_000,
  longContextPricing: {
    threshold: 272_000,
    multipliers: { input: 2, cacheRead: 2, cacheWrite: 2, output: 1.5 },
  },
} as const;

export const CODING_AGENT_MODELS: readonly CodingAgentModel[] = [
  {
    ...GPT_6_SOL_BASE,
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    ...GPT_6_SOL_BASE,
    api: "openai-codex-responses",
    provider: "openai-codex",
    baseUrl: "https://chatgpt.com/backend-api",
  },
  {
    ...GPT_6_LUNA_BASE,
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    ...GPT_6_LUNA_BASE,
    api: "openai-codex-responses",
    provider: "openai-codex",
    baseUrl: "https://chatgpt.com/backend-api",
  },
  {
    ...GPT_6_ASTRA_BASE,
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    ...GPT_6_ASTRA_BASE,
    api: "openai-codex-responses",
    provider: "openai-codex",
    baseUrl: "https://chatgpt.com/backend-api",
  },
  {
    ...GPT_6_ASTRA_BASE,
    provider: "codex-cli",
    baseUrl: "bridge:codex-cli",
  },
  {
    ...GPT_6_ASTRA_BASE,
    id: "openai/gpt-6-astra",
    provider: "indusagi-cli",
    baseUrl: "bridge:indusagi-cli",
  },
  {
    ...GPT_6_ASTRA_BASE,
    id: "openai-codex/gpt-6-astra",
    api: "openai-codex-responses",
    provider: "indusagi-cli",
    baseUrl: "bridge:indusagi-cli",
  },
];

export function applyCodingAgentModelOverlay(registry: ModelRegistry): ModelRegistry {
  for (const model of CODING_AGENT_MODELS) registry.registerCustomModel(model);
  return registry;
}

export function createCodingAgentModelRegistry(): ModelRegistry {
  return applyCodingAgentModelOverlay(new ModelRegistry());
}

export function isReasoningEffortSupported(modelId: string | undefined, effort: string): boolean {
	const id = modelId?.split("/").at(-1);
	if (id === "gpt-6-astra") {
		return GPT_6_ASTRA_BASE.reasoningEfforts.includes(effort as AstraReasoningLevel);
	}
	if (id === "gpt-6-sol") return effort === "high";
	if (id === "gpt-6-luna") {
		return GPT_6_LUNA_BASE.reasoningEfforts.includes(effort as AstraReasoningLevel);
	}
	return true;
}
