import {
  chmodSync,
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";

const PRIVATE_DIRECTORY_MODE = 0o700;
const PRIVATE_FILE_MODE = 0o600;
const NO_FOLLOW = constants.O_NOFOLLOW ?? 0;

function isPosix(): boolean {
  return process.platform !== "win32";
}

function assertOwned(uid: number, path: string): void {
  if (!isPosix() || process.getuid === undefined) return;
  if (uid !== process.getuid()) {
    throw new Error(`Refusing sensitive path not owned by the current user: ${path}`);
  }
}

export function ensurePrivateDirectorySync(path: string): void {
  try {
    const current = lstatSync(path);
    if (current.isSymbolicLink() || !current.isDirectory()) {
      throw new Error(`Refusing non-directory sensitive state path: ${path}`);
    }
    assertOwned(current.uid, path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    mkdirSync(path, { recursive: true, mode: PRIVATE_DIRECTORY_MODE });
  }
  if (isPosix()) chmodSync(path, PRIVATE_DIRECTORY_MODE);
}

function validateExistingFile(path: string): void {
  try {
    const current = lstatSync(path);
    if (current.isSymbolicLink() || !current.isFile()) {
      throw new Error(`Refusing non-regular sensitive file: ${path}`);
    }
    assertOwned(current.uid, path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}

export function readPrivateFileSync(path: string): string | null {
  ensurePrivateDirectorySync(dirname(path));
  try {
    validateExistingFile(path);
    const fd = openSync(path, constants.O_RDONLY | NO_FOLLOW);
    try {
      const current = fstatSync(fd);
      if (!current.isFile()) throw new Error(`Refusing non-regular sensitive file: ${path}`);
      assertOwned(current.uid, path);
      if (isPosix()) fchmodSync(fd, PRIVATE_FILE_MODE);
      return readFileSync(fd, "utf8");
    } finally {
      closeSync(fd);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function atomicWritePrivateFileSync(path: string, content: string): void {
  const parent = dirname(path);
  ensurePrivateDirectorySync(parent);
  validateExistingFile(path);
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  let fd: number | undefined;
  try {
    fd = openSync(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NO_FOLLOW,
      PRIVATE_FILE_MODE,
    );
    writeFileSync(fd, content, "utf8");
    if (isPosix()) fchmodSync(fd, PRIVATE_FILE_MODE);
    closeSync(fd);
    fd = undefined;
    renameSync(temporary, path);
    if (isPosix()) chmodSync(path, PRIVATE_FILE_MODE);
  } catch (error) {
    if (fd !== undefined) closeSync(fd);
    try { rmSync(temporary, { force: true }); } catch { /* best effort cleanup */ }
    throw error;
  }
}

export function appendPrivateFileSync(path: string, content: string): void {
  ensurePrivateDirectorySync(dirname(path));
  validateExistingFile(path);
  const fd = openSync(
    path,
    constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | NO_FOLLOW,
    PRIVATE_FILE_MODE,
  );
  try {
    const current = fstatSync(fd);
    if (!current.isFile()) throw new Error(`Refusing non-regular sensitive file: ${path}`);
    assertOwned(current.uid, path);
    if (isPosix()) fchmodSync(fd, PRIVATE_FILE_MODE);
    writeFileSync(fd, content, "utf8");
  } finally {
    closeSync(fd);
  }
}
