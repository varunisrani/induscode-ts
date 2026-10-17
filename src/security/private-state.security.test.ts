import { afterEach, describe, expect, it } from "vitest";
import { chmod, lstat, mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAuthVault } from "../boot/auth-vault.js";
import { storeServerToken } from "../boot/server-token.js";
import { resolveSarvamConfig, saveSarvamConfig } from "../integrations/sarvam/config.js";
import { fsBackend } from "../conductor/transcript-store/store.js";
import { createWorkspace, ensureDirs } from "../workspace/locator.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function root(): Promise<string> {
  const value = await mkdtemp(join(tmpdir(), "indus-private-state-"));
  roots.push(value);
  return value;
}

async function expectPrivate(path: string, mode: number): Promise<void> {
  if (process.platform !== "win32") expect((await stat(path)).mode & 0o777).toBe(mode);
}

describe("private persistence", () => {
  it("repairs existing agent state directories during workspace startup", async () => {
    const base = await root();
    const workspace = createWorkspace({ home: base, env: {} });
    await mkdir(workspace.profileDir, { recursive: true, mode: 0o777 });
    await mkdir(workspace.sessionsDir, { mode: 0o777 });
    await chmod(workspace.profileDir, 0o777);
    await chmod(workspace.sessionsDir, 0o777);

    ensureDirs(workspace);

    await expectPrivate(workspace.profileDir, 0o700);
    await expectPrivate(workspace.sessionsDir, 0o700);
  });

  it("repairs permissive auth file and directory modes independent of umask", async () => {
    const base = await root();
    const dir = join(base, "profile");
    const path = join(dir, "auth.json");
    await mkdir(dir, { mode: 0o777 });
    await writeFile(path, "{}", { mode: 0o666 });
    await chmod(dir, 0o777);
    await chmod(path, 0o666);
    const previous = process.umask(0);
    try {
      await createAuthVault(path).putApiKey("provider", "default", "synthetic", true);
    } finally {
      process.umask(previous);
    }

    await expectPrivate(dir, 0o700);
    await expectPrivate(path, 0o600);
  });

  it("rejects a symlink credential destination without changing its target", async () => {
    if (process.platform === "win32") return;
    const base = await root();
    const dir = join(base, "profile");
    const target = join(base, "target.json");
    const path = join(dir, "auth.json");
    await mkdir(dir);
    await writeFile(target, "unchanged");
    await symlink(target, path);

    await expect(createAuthVault(path).putApiKey("provider", "default", "synthetic", true)).rejects.toThrow(/Refusing/);
    expect(await readFile(target, "utf8")).toBe("unchanged");
  });

  it("creates and repairs transcript storage as owner-only and rejects symlinks", async () => {
    const base = await root();
    const dir = join(base, "sessions");
    const path = join(dir, "session.ndjson");
    await mkdir(dir, { mode: 0o777 });
    await writeFile(path, "old\n", { mode: 0o666 });
    await chmod(dir, 0o777);
    await chmod(path, 0o666);
    const previous = process.umask(0);
    try {
      await fsBackend(dir).append("session", "new");
    } finally {
      process.umask(previous);
    }
    await expectPrivate(dir, 0o700);
    await expectPrivate(path, 0o600);

    if (process.platform !== "win32") {
      const target = join(base, "outside.ndjson");
      await writeFile(target, "unchanged");
      await rm(path);
      await symlink(target, path);
      await expect(fsBackend(dir).rewrite("session", "replacement")).rejects.toThrow(/Refusing/);
      expect(await readFile(target, "utf8")).toBe("unchanged");
    }
  });

  it("stores server tokens atomically with private modes and rejects symlinks", async () => {
    const base = await root();
    const configDir = join(base, "agent");
    const tokenFile = join(configDir, "server-token.json");
    const previous = process.umask(0);
    try {
      expect(await storeServerToken({ access_token: "synthetic" }, { configDir, tokenFile })).toBe(true);
    } finally {
      process.umask(previous);
    }
    await expectPrivate(configDir, 0o700);
    await expectPrivate(tokenFile, 0o600);

    if (process.platform !== "win32") {
      const target = join(base, "outside-token.json");
      await writeFile(target, "unchanged");
      await rm(tokenFile);
      await symlink(target, tokenFile);
      expect(await storeServerToken({ access_token: "replacement" }, { configDir, tokenFile })).toBe(false);
      expect(await readFile(target, "utf8")).toBe("unchanged");
    }
  });

  it("keeps API keys out of project Sarvam config and protects profile config", async () => {
    const base = await root();
    const cwd = join(base, "repo");
    const home = join(base, "home");
    await mkdir(cwd);
    await mkdir(home);

    const projectPath = saveSarvamConfig({ apiKey: "synthetic", enabled: true }, "project", cwd, home);
    expect(JSON.parse(await readFile(projectPath, "utf8"))).not.toHaveProperty("apiKey");
    await writeFile(projectPath, JSON.stringify({ enabled: true, apiKey: "legacy-project-key" }));
    expect(resolveSarvamConfig({ cwd, home, env: {} })).toBeUndefined();

    const profilePath = saveSarvamConfig({ apiKey: "synthetic", enabled: true }, "profile", cwd, home);
    expect(JSON.parse(await readFile(profilePath, "utf8"))).toHaveProperty("apiKey", "synthetic");
    await expectPrivate(join(home, ".indusagi", "agent"), 0o700);
    await expectPrivate(profilePath, 0o600);
    expect((await lstat(profilePath)).isSymbolicLink()).toBe(false);
  });
});
