/**
 * Directory reader — the live `fs`-backed implementation of {@link DirReader}.
 */
import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import type { DirReader } from "./complete.js";

function entryIsDir(base: string, name: string, isDirent: boolean, isSymlink: boolean) {
  if (isDirent) return true;
  if (!isSymlink) return false;
  try {
    return statSync(resolve(base, name)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Build a live {@link DirReader} rooted at `cwd`.
 */
export function createDirReader(cwd: string = process.cwd()): DirReader {
  return (dirPath: string) => {
    const expanded = dirPath === "~" ? homedir() : dirPath.startsWith("~/") ? resolve(homedir(), dirPath.slice(2)) : dirPath;
    const target = resolve(cwd, expanded);
    try {
      const dirents = readdirSync(target, { withFileTypes: true });
      return dirents.map((d) => ({
        name: d.name,
        isDir: entryIsDir(target, d.name, d.isDirectory(), d.isSymbolicLink())
      }));
    } catch {
      return [];
    }
  };
}