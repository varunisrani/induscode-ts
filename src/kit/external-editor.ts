/**
 * External-editor kit — hand the composer buffer off to the user's `$EDITOR`,
 * wait for them to close it, and read the edited text back.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FALLBACK_EDITOR = "vi";

export interface ExternalEditorOptions {
  readonly env?: NodeJS.ProcessEnv;
  readonly dir?: string;
}

function resolveEditor(env: NodeJS.ProcessEnv): string[] {
  const configured = env.VISUAL || env.EDITOR || FALLBACK_EDITOR;
  const parts = configured.split(/\s+/).filter((part) => part.length > 0);
  return parts.length > 0 ? parts : [FALLBACK_EDITOR];
}

export function openInExternalEditor(
  buffer: string,
  options: ExternalEditorOptions = {},
): string | null {
  const env = options.env ?? process.env;
  const dir = options.dir ?? tmpdir();
  const name = `indus-editor-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}.md`;
  const path = join(dir, name);
  const [editor, ...editorArgs] = resolveEditor(env);
  try {
    writeFileSync(path, buffer, "utf8");
    const result = spawnSync(editor, [...editorArgs, path], { stdio: "inherit" });
    if (result.error || result.status !== 0) return null;
    return readFileSync(path, "utf8").replace(/\n$/, "");
  } catch {
    return null;
  } finally {
    try {
      unlinkSync(path);
    } catch {
      /* ignore cleanup errors */
    }
  }
}