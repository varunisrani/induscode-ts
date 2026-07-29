/**
 * Image kit — magic-byte sniffing for the two raster formats the agent ships
 * support for, plus a tiny asset-naming helper.
 */

export type ImageFormat = "png" | "jpeg";
export type ImageMediaType = "image/png" | "image/jpeg";

const PNG_SIGNATURE: readonly number[] = [137, 80, 78, 71, 13, 10, 26, 10];
const JPEG_SIGNATURE: readonly number[] = [255, 216, 255];

export const IMAGE_SNIFF_BYTES: number = PNG_SIGNATURE.length;

export type ByteSource = ArrayLike<number>;

function startsWith(bytes: ArrayLike<number>, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[index] !== signature[index]) return false;
  }
  return true;
}

export function sniffImageFormat(bytes: ByteSource): ImageFormat | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return "png";
  if (startsWith(bytes, JPEG_SIGNATURE)) return "jpeg";
  return null;
}

export function mediaTypeForImageFormat(format: ImageFormat): ImageMediaType {
  return format === "png" ? "image/png" : "image/jpeg";
}

export function detectImageMediaType(bytes: ByteSource): ImageMediaType | null {
  const format = sniffImageFormat(bytes);
  return format === null ? null : mediaTypeForImageFormat(format);
}

export function isSupportedImage(bytes: ByteSource): boolean {
  return sniffImageFormat(bytes) !== null;
}

export interface AssetNameContext {
  readonly platform?: string;
  readonly arch?: string;
  readonly version?: string;
  readonly name?: string;
}

const ASSET_TOKENS = ["platform", "arch", "version", "name"];

export function resolveAssetName(template: string, context: AssetNameContext): string {
  let rendered = template;
  for (const token of ASSET_TOKENS) {
    const value = context[token as keyof AssetNameContext] ?? "";
    rendered = rendered.split(`{${token}}`).join(value);
  }
  return rendered;
}