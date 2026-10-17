import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { VERSION } from "./brand.js";

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
) as { dependencies?: Record<string, string> };

describe("VERSION", () => {
  it("matches the 0.2.14 package release used by benchmarks", () => {
    expect(VERSION).toBe("0.2.14");
  });

  it("does not depend on its own package tarball", () => {
    expect(packageJson.dependencies?.["indusagi-coding-agent"]).toBeUndefined();
  });

  it("uses the local sibling framework when run from source", () => {
    expect(packageJson.dependencies?.indusagi).toBe("file:../indus-rebuild");
  });
});
