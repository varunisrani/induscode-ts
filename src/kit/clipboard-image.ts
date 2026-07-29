/**
 * Clipboard-image kit — pull a raster image off the OS clipboard and stage it
 * on disk as a temp PNG, returning the path the composer can splice into a
 * prompt.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const READ_TIMEOUT_MS = 3000;
const MAX_BUFFER_BYTES = 50 * 1024 * 1024;

export interface ClipboardImageOptions {
  readonly platform?: NodeJS.Platform;
  readonly env?: NodeJS.ProcessEnv;
  readonly dir?: string;
}

function captureStdout(command: string, args: string[]): Buffer | null {
  const result = spawnSync(command, [...args], {
    timeout: READ_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER_BYTES,
  });
  if (result.error || result.status !== 0) return null;
  const out = result.stdout;
  if (!Buffer.isBuffer(out) || out.length === 0) return null;
  return out;
}

function captureViaOsascript(): Buffer | null {
  const result = spawnSync(
    "osascript",
    [
      "-e",
      "try",
      "-e",
      "set png to (the clipboard as \xABclass PNGf\xBB)",
      "-e",
      'set fp to (path to temporary items as string) & "indus-clip.png"',
      "-e",
      "set fh to open for access file fp with write permission",
      "-e",
      "set eof fh to 0",
      "-e",
      "write png to fh",
      "-e",
      "close access fh",
      "-e",
      "POSIX path of fp",
      "-e",
      "on error",
      "-e",
      'return ""',
      "-e",
      "end try",
    ],
    { timeout: READ_TIMEOUT_MS, encoding: "utf8" },
  );
  if (result.error || result.status !== 0) return null;
  const path = String(result.stdout ?? "").trim();
  if (path.length === 0) return null;
  try {
    const bytes = readFileSync(path);
    return bytes.length > 0 ? bytes : null;
  } catch {
    return null;
  }
}

function readClipboardBytes(platform: NodeJS.Platform, env: NodeJS.ProcessEnv): Buffer | null {
  if (platform === "darwin") {
    return captureStdout("pngpaste", ["-"]) ?? captureViaOsascript();
  }
  if (platform === "linux") {
    const wayland =
      Boolean(env.WAYLAND_DISPLAY) || env.XDG_SESSION_TYPE === "wayland";
    if (wayland) {
      const fromWayland = captureStdout("wl-paste", [
        "--type",
        "image/png",
        "--no-newline",
      ]);
      if (fromWayland) return fromWayland;
    }
    return captureStdout("xclip", ["-selection", "clipboard", "-t", "image/png", "-o"]);
  }
  return null;
}

export function readClipboardImage(options: ClipboardImageOptions = {}): string | null {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const bytes = readClipboardBytes(platform, env);
  if (bytes === null) return null;
  const dir = options.dir ?? tmpdir();
  const name = `indus-clipboard-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}.png`;
  const path = join(dir, name);
  try {
    writeFileSync(path, bytes);
    return path;
  } catch {
    return null;
  }
}