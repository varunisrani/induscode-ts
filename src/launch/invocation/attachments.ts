/**
 * The attachment gatherer — expands `@file` references into one
 * {@link Attachments} value.
 */
import { readFile, stat } from "node:fs/promises";
import { extname } from "node:path";
import type { ImageContent } from "indusagi/ai";
import { resolveReadPath } from "indusagi/agent";
import type { Attachments, AttachmentOptions } from "../contract.js";

const MAX_TEXT_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const TEXT_EXTENSIONS: ReadonlySet<string> = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".csv",
  ".tsv",
  ".xml",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".c",
  ".h",
  ".cc",
  ".cpp",
  ".hpp",
  ".cs",
  ".php",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".log",
  ".env",
  ".gitignore",
  ".dockerfile",
]);

const IMAGE_MIME_BY_EXT: ReadonlyMap<string, string> = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".bmp", "image/bmp"],
  [".svg", "image/svg+xml"],
]);

export type AttachmentErrorKind = "unsupported" | "too-large" | "not-found" | "read-failed";

export class AttachmentError extends Error {
  readonly kind: AttachmentErrorKind;
  readonly reference: string;
  readonly resolvedPath?: string;
  readonly cause?: unknown;

  constructor(
    kind: AttachmentErrorKind,
    message: string,
    detail: { reference: string; resolvedPath?: string; cause?: unknown },
  ) {
    super(message);
    this.name = "AttachmentError";
    this.kind = kind;
    this.reference = detail.reference;
    if (detail.resolvedPath !== undefined) this.resolvedPath = detail.resolvedPath;
    if (detail.cause !== undefined) this.cause = detail.cause;
  }
}

function extensionOf(path: string): string {
  return extname(path).toLowerCase();
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

async function sizeOf(resolvedPath: string, reference: string): Promise<number> {
  try {
    const info = await stat(resolvedPath);
    return info.size;
  } catch (error) {
    if (isMissing(error)) {
      throw new AttachmentError("not-found", `No such file: ${reference}`, {
        reference,
        resolvedPath,
        cause: error,
      });
    }
    throw new AttachmentError("read-failed", `Could not access file: ${reference}`, {
      reference,
      resolvedPath,
      cause: error,
    });
  }
}

function wrapTextBlock(resolvedPath: string, body: string): string {
  return `<file path="${resolvedPath}">\n${body}\n</file>`;
}

/**
 * Expand the `@file` references into a single {@link Attachments} value.
 */
export async function gatherAttachments(
  references: readonly string[],
  options: AttachmentOptions,
): Promise<Attachments> {
  const blocks: string[] = [];
  const media: ImageContent[] = [];
  for (const reference of references) {
    const resolvedPath = resolveReadPath(reference, options.cwd);
    const ext = extensionOf(resolvedPath);
    const imageMime = IMAGE_MIME_BY_EXT.get(ext);
    const isText = TEXT_EXTENSIONS.has(ext);
    if (imageMime === undefined && !isText) {
      throw new AttachmentError("unsupported", `Unsupported attachment type: ${reference}`, {
        reference,
        resolvedPath,
      });
    }
    const size = await sizeOf(resolvedPath, reference);
    if (size === 0) continue;
    const cap = imageMime !== undefined ? MAX_IMAGE_BYTES : MAX_TEXT_BYTES;
    if (size > cap) {
      throw new AttachmentError("too-large", `Attachment exceeds the size limit: ${reference}`, {
        reference,
        resolvedPath,
      });
    }
    try {
      if (imageMime !== undefined) {
        const bytes = await readFile(resolvedPath);
        media.push({
          type: "image",
          data: bytes.toString("base64"),
          mimeType: imageMime,
        });
      } else {
        const body = await readFile(resolvedPath, "utf8");
        if (body.length > 0) blocks.push(wrapTextBlock(resolvedPath, body));
      }
    } catch (error) {
      throw new AttachmentError("read-failed", `Could not read file: ${reference}`, {
        reference,
        resolvedPath,
        cause: error,
      });
    }
  }
  return { prose: blocks.join("\n\n"), media };
}