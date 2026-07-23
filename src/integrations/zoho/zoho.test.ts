import { describe, it, expect } from "vitest";
import { resolveZohoConfig, redactUrl } from "./config.js";

describe("resolveZohoConfig", () => {
  const isolatedHome = "/tmp/indusagi-zoho-test-home-empty";

  it("returns undefined when nothing is configured", () => {
    expect(
      resolveZohoConfig({ env: {}, cwd: "/tmp", home: isolatedHome, disabled: false }),
    ).toBeUndefined();
  });

  it("prefers explicit url over env", () => {
    const cfg = resolveZohoConfig({
      url: "https://mcp.example/a",
      env: { ZOHO_MCP_URL: "https://mcp.example/b" },
      cwd: "/tmp",
      home: isolatedHome,
    });
    expect(cfg?.url).toBe("https://mcp.example/a");
  });

  it("honors ZOHO_MCP_URL", () => {
    const cfg = resolveZohoConfig({
      env: { ZOHO_MCP_URL: "https://mcp.zoho.example/x" },
      cwd: "/tmp",
      home: isolatedHome,
    });
    expect(cfg?.url).toBe("https://mcp.zoho.example/x");
    expect(cfg?.id).toBe("zoho");
  });

  it("disabled wins", () => {
    const cfg = resolveZohoConfig({
      url: "https://mcp.example/a",
      disabled: true,
      cwd: "/tmp",
      home: isolatedHome,
    });
    expect(cfg).toBeUndefined();
  });
});

describe("redactUrl", () => {
  it("keeps host", () => {
    const r = redactUrl("https://mcp.zoho.in/secret/path/more");
    expect(r).toContain("mcp.zoho.in");
    expect(r).toContain("…");
  });
});
