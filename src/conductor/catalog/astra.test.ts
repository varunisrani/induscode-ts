import { describe, expect, it } from "vitest";
import type { ModelRegistry } from "indusagi/ai";
import { registerCustomModel } from "indusagi/ai";
import { loadModelRegistry } from "../../boot/stages.js";
import { registrySource } from "../../launch/catalog.js";
import { ModelCatalog } from "./catalog.js";

describe("GPT-6 Astra catalog support", () => {
  it("exposes the direct OpenAI Responses model with its published capabilities and pricing", () => {
    const model = new ModelCatalog().get("openai/gpt-6-astra")?.model as any;

    expect(model).toEqual(expect.objectContaining({
      id: "gpt-6-astra",
      name: "GPT-6 Astra",
      api: "openai-responses",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      reasoning: true,
      reasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
      input: ["text", "image"],
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
    }));
  });

  it("exposes Astra through direct API, ChatGPT OAuth, Codex CLI, and Indusagi bridges", () => {
    const catalog = new ModelCatalog();

    expect(catalog.get("codex-cli/gpt-6-astra")?.model.baseUrl).toBe("bridge:codex-cli");
    expect(catalog.get("indusagi-cli/openai/gpt-6-astra")?.model.baseUrl).toBe("bridge:indusagi-cli");
    expect(catalog.get("openai-codex/gpt-6-astra")?.model).toMatchObject({
      api: "openai-codex-responses",
      baseUrl: "https://chatgpt.com/backend-api",
    });
    expect(catalog.get("indusagi-cli/openai-codex/gpt-6-astra")?.model.baseUrl).toBe("bridge:indusagi-cli");
  });

  it("preserves framework custom models registered after the catalog module loads", () => {
    registerCustomModel({
      id: "late-model",
      name: "Late Model",
      api: "openai-responses",
      provider: "late-provider",
      baseUrl: "https://example.invalid/v1",
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1_000,
      maxTokens: 100,
    });

    expect(new ModelCatalog().get("late-provider/late-model")?.model.name).toBe("Late Model");
  });

  it("installs Astra in both runtime registry construction paths", async () => {
    const startupRegistry = await loadModelRegistry() as ModelRegistry;
    const listModelsSource = registrySource();

    expect(startupRegistry.getModel("openai", "gpt-6-astra").name).toBe("GPT-6 Astra");
    expect(startupRegistry.getModel("openai-codex", "gpt-6-astra").name).toBe("GPT-6 Astra");
    expect(listModelsSource.models("openai").some((model) => model.id === "gpt-6-astra")).toBe(true);
    expect(listModelsSource.models("openai-codex").some((model) => model.id === "gpt-6-astra")).toBe(true);
  });
});

describe("GPT-6 Sol catalog support", () => {
  it.each(["openai", "openai-codex"] as const)("shows GPT-6 Sol through %s", (provider) => {
    const catalog = new ModelCatalog();
    const model = catalog.get(`${provider}/gpt-6-sol`)?.model as any;

    expect(model).toMatchObject({
      id: "gpt-6-sol",
      name: "GPT-6 Sol",
      api: provider === "openai" ? "openai-responses" : "openai-codex-responses",
      provider,
      baseUrl: provider === "openai" ? "https://api.openai.com/v1" : "https://chatgpt.com/backend-api",
      reasoning: true,
      reasoningEfforts: ["high"],
    });
  });

  it("publishes GPT-6 Sol through both providers in startup and /model registry paths", async () => {
    const startupRegistry = await loadModelRegistry() as ModelRegistry;
    const listModelsSource = registrySource();

    for (const provider of ["openai", "openai-codex"] as const) {
      expect(startupRegistry.getModel(provider, "gpt-6-sol").name).toBe("GPT-6 Sol");
      expect(listModelsSource.models(provider).some((model) => model.id === "gpt-6-sol")).toBe(true);
    }
  });
});

describe("GPT-6 Luna catalog support", () => {
  it.each(["openai", "openai-codex"] as const)("publishes exact Luna metadata through %s", (provider) => {
    const catalog = new ModelCatalog();
    const model = catalog.get(`${provider}/gpt-6-luna`)?.model as any;
    expect(model).toMatchObject({
      id: "gpt-6-luna",
      name: "GPT-6 Luna",
      provider,
      api: provider === "openai" ? "openai-responses" : "openai-codex-responses",
      baseUrl: provider === "openai" ? "https://api.openai.com/v1" : "https://chatgpt.com/backend-api",
      reasoning: true,
      reasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
      input: ["text", "image"],
      cost: { input: 0.1, cacheRead: 0.01, cacheWrite: 0.125, output: 0.5 },
      contextWindow: 1_050_000,
      maxTokens: 128_000,
    });
  });

  it("installs Luna in startup and /model registry paths", async () => {
    const startupRegistry = await loadModelRegistry() as ModelRegistry;
    const listModelsSource = registrySource();
    for (const provider of ["openai", "openai-codex"] as const) {
      expect(startupRegistry.getModel(provider, "gpt-6-luna").name).toBe("GPT-6 Luna");
      expect(listModelsSource.models(provider).some((model) => model.id === "gpt-6-luna")).toBe(true);
    }
  });
});
