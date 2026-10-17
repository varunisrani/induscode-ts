import { afterEach, describe, expect, it } from "vitest";
import { chmod, mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAddonHost } from "./addon-wiring.js";
import type { BootContext } from "../contract.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture(): Promise<{ root: string; marker: string; addon: string; ctx: BootContext }> {
  const root = await mkdtemp(join(tmpdir(), "indus-addon-trust-"));
  roots.push(root);
  const workspace = join(root, "repo");
  const profileDir = join(root, "profile");
  const addons = join(workspace, ".indus", "addons");
  await mkdir(addons, { recursive: true });
  const marker = join(root, "executed.txt");
  const addon = join(addons, "probe.js");
  await writeFile(addon, `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(marker)}, "executed");\nexport function register() {}\n`);
  const ctx = {
    argv: [],
    brand: {} as BootContext["brand"],
    workspace: { profileDir } as BootContext["workspace"],
    invocation: { mode: "repl", cwd: workspace, flags: {}, rest: [] },
    closables: [],
  } as BootContext;
  return { root, marker, addon, ctx };
}

describe("project addon trust boundary", () => {
  it("does not evaluate an untrusted project addon", async () => {
    const { marker, ctx } = await fixture();

    const bundle = await buildAddonHost(ctx);

    await expect(readFile(marker, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(bundle.loaded).toEqual([]);
  });

  it("loads only after explicit approval and reuses trust for the unchanged digest", async () => {
    const { marker, ctx } = await fixture();
    const approved = { ...ctx, invocation: { ...ctx.invocation, flags: { "trust-project-addons": true } } };

    expect((await buildAddonHost(approved)).loaded).toHaveLength(1);
    expect(await readFile(marker, "utf8")).toBe("executed");
    await rm(marker);
    expect((await buildAddonHost(ctx)).loaded).toHaveLength(1);
    expect(await readFile(marker, "utf8")).toBe("executed");

    if (process.platform !== "win32") {
      expect((await stat(join(ctx.workspace.profileDir, "addon-trust.json"))).mode & 0o777).toBe(0o600);
      expect((await stat(ctx.workspace.profileDir)).mode & 0o777).toBe(0o700);
    }
  });

  it("invalidates approval when addon content changes", async () => {
    const { marker, addon, ctx } = await fixture();
    const approved = { ...ctx, invocation: { ...ctx.invocation, flags: { "trust-project-addons": true } } };
    await buildAddonHost(approved);
    await rm(marker);
    await writeFile(addon, `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(marker)}, "changed");\nexport function register() {}\n`);

    const bundle = await buildAddonHost(ctx);

    await expect(readFile(marker, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(bundle.loaded).toEqual([]);
  });

  it("rejects symlinks in the trusted addon tree before module evaluation", async () => {
    if (process.platform === "win32") return;
    const { marker, addon, ctx } = await fixture();
    const outside = join(ctx.invocation.cwd!, "..", "outside.js");
    await writeFile(outside, await readFile(addon, "utf8"));
    await rm(addon);
    const { symlink } = await import("node:fs/promises");
    await symlink(outside, addon);
    await chmod(outside, 0o644);
    const approved = { ...ctx, invocation: { ...ctx.invocation, flags: { "trust-project-addons": true } } };

    const bundle = await buildAddonHost(approved);

    await expect(readFile(marker, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(bundle.loaded).toEqual([]);
  });
});
