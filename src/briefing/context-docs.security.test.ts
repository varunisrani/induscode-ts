import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gatherContextDocs } from "./context-docs.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function workspace(): Promise<{ root: string; repo: string; home: string }> {
  const root = await mkdtemp(join(tmpdir(), "indus-context-security-"));
  roots.push(root);
  const repo = join(root, "repo");
  const home = join(root, "home");
  await mkdir(repo);
  await mkdir(home);
  return { root, repo, home };
}

describe("context import trust boundary", () => {
  it("loads regular imports confined to the canonical workspace", async () => {
    const { repo, home } = await workspace();
    await writeFile(join(repo, "AGENTS.md"), "project rules\n@docs/rules.md\n");
    await mkdir(join(repo, "docs"));
    await writeFile(join(repo, "docs", "rules.md"), "internal rules");

    const docs = gatherContextDocs(repo, home);

    expect(docs.map((doc) => doc.body)).toEqual(["project rules\n@docs/rules.md", "internal rules"]);
  });

  it("denies parent, absolute, and home imports unless the exact external file is approved", async () => {
    const { root, repo, home } = await workspace();
    const outside = join(root, "outside.txt");
    const homeFile = join(home, "private.txt");
    await writeFile(outside, "outside secret");
    await writeFile(homeFile, "home secret");
    await writeFile(join(root, "AGENTS.md"), "parent instructions");
    await writeFile(join(repo, "AGENTS.md"), `rules\n@../outside.txt\n@${outside}\n@~/private.txt\n`);

    expect(gatherContextDocs(repo, home).map((doc) => doc.body)).toEqual([
      `rules\n@../outside.txt\n@${outside}\n@~/private.txt`,
    ]);
    expect(gatherContextDocs(repo, home, { approvedExternalPaths: [outside] }).map((doc) => doc.body)).toContain("outside secret");
  });

  it("rejects a symlink that escapes the workspace even when its lexical path is internal", async () => {
    if (process.platform === "win32") return;
    const { root, repo, home } = await workspace();
    const outside = join(root, "outside.txt");
    await writeFile(outside, "outside secret");
    await symlink(outside, join(repo, "linked.txt"));
    await writeFile(join(repo, "AGENTS.md"), "rules\n@linked.txt\n");

    const docs = gatherContextDocs(repo, home);

    expect(docs.map((doc) => doc.body)).not.toContain("outside secret");
  });

  it("never autoimports likely secret files, including explicitly approved external .env files", async () => {
    const { root, repo, home } = await workspace();
    const env = join(root, ".env");
    await writeFile(env, "SYNTHETIC_TOKEN=not-a-real-secret");
    await writeFile(join(repo, "AGENTS.md"), `rules\n@${env}\n`);

    const docs = gatherContextDocs(repo, home, { approvedExternalPaths: [env] });

    expect(docs.map((doc) => doc.body)).not.toContain("SYNTHETIC_TOKEN=not-a-real-secret");
  });
});
