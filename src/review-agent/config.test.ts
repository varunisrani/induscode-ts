import { describe, expect, it } from "vitest";
import { loadReviewAgentConfig } from "./config.js";

describe("review agent config", () => {
  it("uses the configured sdsdsd Supabase project URL and requires secrets", () => {
    expect(() => loadReviewAgentConfig({ GITHUB_WEBHOOK_SECRET: "secret" })).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    const config = loadReviewAgentConfig({
      GITHUB_WEBHOOK_SECRET: "webhook-secret",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
      GITHUB_TOKEN: "github-token",
      ANTHROPIC_API_KEY: "model-key",
    });
    expect(config.supabaseUrl).toBe("https://bnaadeovgcqgbrnrfcef.supabase.co");
    expect(config.modelId).toBe("anthropic/claude-sonnet-4-6");
  });

  it("accepts GitHub App credentials without a development token", () => {
    const config = loadReviewAgentConfig({
      GITHUB_WEBHOOK_SECRET: "webhook-secret",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
      GITHUB_APP_ID: "123",
      GITHUB_APP_PRIVATE_KEY: "line1\\nline2",
      ANTHROPIC_API_KEY: "model-key",
    });
    expect(config.githubApp?.privateKey).toContain("\n");
  });

  it("honors the documented review-agent server variables", () => {
    const config = loadReviewAgentConfig({
      GITHUB_WEBHOOK_SECRET: "webhook-secret",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
      GITHUB_TOKEN: "github-token",
      ANTHROPIC_API_KEY: "model-key",
      REVIEW_AGENT_HOST: "127.0.0.1",
      REVIEW_AGENT_PORT: "9000",
      REVIEW_AGENT_POLL_MS: "1500",
      REVIEW_AGENT_JOBS_PER_TICK: "2",
    });
    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(9000);
    expect(config.pollIntervalMs).toBe(1500);
    expect(config.maxJobsPerTick).toBe(2);
  });
});
