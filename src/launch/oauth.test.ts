import { afterEach, describe, expect, it, vi } from "vitest";
import { hasRegisteredOAuthClientId, launchAttempts } from "./oauth.js";

afterEach(() => vi.unstubAllEnvs());

describe("OpenAI Codex OAuth registration", () => {
  it("uses the framework client when no environment override exists", () => {
    vi.stubEnv("INDUSAGI_OPENAI_CODEX_CLIENT_ID", "");
    expect(hasRegisteredOAuthClientId("openai-codex")).toBe(true);
  });

  it("opens ampersand-heavy OAuth URLs on Windows without cmd parsing", () => {
    const url = "https://example.com/oauth?response_type=code&client_id=client&scope=openid";
    expect(launchAttempts(url, "win32")).toEqual([
      { command: "rundll32.exe", args: ["url.dll,FileProtocolHandler", url] },
    ]);
  });
});
