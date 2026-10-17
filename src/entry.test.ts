import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveBoot } from "./entry.js";

describe("resolveBoot", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prints fatal boot errors and returns a failing exit code", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);

    await expect(resolveBoot(Promise.reject(new Error("startup failed")))).resolves.toBe(1);
    expect(stderr).toHaveBeenCalledWith("indusagi: startup failed\n");
  });

  it("preserves successful exit codes", async () => {
    await expect(resolveBoot(Promise.resolve(0))).resolves.toBe(0);
  });
});