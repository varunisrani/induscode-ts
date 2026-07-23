import { describe, it, expect } from "vitest";
import { resolveSarvamConfig, redactApiKey } from "./config.js";

describe("resolveSarvamConfig", () => {
  const isolatedHome = "/tmp/indusagi-sarvam-test-home-empty";

  it("returns undefined when nothing is configured", () => {
    expect(
      resolveSarvamConfig({ env: {}, cwd: "/tmp", home: isolatedHome, disabled: false }),
    ).toBeUndefined();
  });

  it("prefers explicit key over env", () => {
    const cfg = resolveSarvamConfig({
      apiKey: "key-from-arg",
      env: { SARVAM_API_KEY: "key-from-env" },
      cwd: "/tmp",
      home: isolatedHome,
    });
    expect(cfg?.apiKey).toBe("key-from-arg");
  });

  it("honors SARVAM_API_KEY", () => {
    const cfg = resolveSarvamConfig({
      env: { SARVAM_API_KEY: "sk-test-123" },
      cwd: "/tmp",
      home: isolatedHome,
    });
    expect(cfg?.apiKey).toBe("sk-test-123");
    expect(cfg?.id).toBe("sarvam");
  });

  it("disabled wins", () => {
    const cfg = resolveSarvamConfig({
      apiKey: "sk-test",
      disabled: true,
      cwd: "/tmp",
      home: isolatedHome,
    });
    expect(cfg).toBeUndefined();
  });

  it("honors basePath from options", () => {
    const cfg = resolveSarvamConfig({
      apiKey: "sk-test",
      basePath: "/tmp/sarvam-out",
      cwd: "/tmp",
      home: isolatedHome,
    });
    expect(cfg?.basePath).toBe("/tmp/sarvam-out");
  });
});

describe("redactApiKey", () => {
  it("masks middle", () => {
    const r = redactApiKey("abcdefghijklmnop");
    expect(r).toContain("…");
    expect(r).not.toBe("abcdefghijklmnop");
  });
});
