// build.mjs — bundle indusagi-coding-agent with esbuild
//
// Produces five entry-point bundles in dist/:
//   dist/entry.js      — CLI runner (the `indus` / `indusagi` bin)
//   dist/guardrails.js — guardrails subsystem
//   dist/index.js      — library barrel
//   dist/review-server.js — Supabase-backed GitHub review worker
//   dist/review-agent.js  — embeddable review-agent API
//
// Note: src/ is already a parallel "bundled-with-types" tree (post-recovery).
// This script does NOT regenerate src/ — it produces the .js bundles that
// Node can run directly. Consumers who want types import from src/.
//
// Usage:
//   node build.mjs

import { build } from "esbuild";
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const outdir = "dist";
if (existsSync(outdir)) {
  // Keep only the JS outputs we control; don't wipe other contents.
  for (const f of ["entry.js", "guardrails.js", "index.js", "review-server.js", "review-agent.js"]) {
    try { rmSync(`${outdir}/${f}`, { force: true }); } catch {}
  }
}
mkdirSync(outdir, { recursive: true });

const common = {
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  logLevel: "info",
  // Allow .ts with nocheck large files
  loader: { ".ts": "ts", ".tsx": "tsx", ".js": "js" },
};

await build({
  ...common,
  entryPoints: {
    entry: "src/entry.ts",
    guardrails: "src/guardrails.ts",
    index: "src/index.ts",
    "review-server": "src/review-agent/server.ts",
    "review-agent": "src/review-agent/index.ts",
  },
  outdir,
  banner: {},
});

// Ensure shebang on entry.js
let entry = readFileSync("dist/entry.js", "utf8");
if (!entry.startsWith("#!")) {
  entry = "#!/usr/bin/env node\n" + entry;
  writeFileSync("dist/entry.js", entry);
}
chmodSync("dist/entry.js", 0o755);
chmodSync("dist/review-server.js", 0o755);

console.log("build ok → dist/entry.js dist/guardrails.js dist/index.js dist/review-server.js dist/review-agent.js");
