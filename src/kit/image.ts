// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Image kit — magic-byte sniffing for the two raster formats the agent ships
 * support for, plus a tiny asset-naming helper.
 *
 * This is a leaf utility: framework-agnostic, dependency-free (Node builtins
 * only), and pure apart from the byte reads it is handed. Two unrelated jobs
 * live here because both are small and both are about turning opaque bytes /
 * platform tuples into a stable name:
 *
 *   - {@link sniffImageFormat} / {@link detectImageMediaType} classify a byte
 *     buffer as PNG or JPEG by inspecting its leading signature bytes. The
 *     signatures are an interface-dictated constant — they are fixed by the PNG
 *     and JFIF/EXIF container specifications, not a choice we make.
 *   - {@link resolveAssetName} renders a release-asset file name from a small
 *     template by substituting platform / architecture / version tokens, so a
 *     provisioner can locate the right download for the host without a per-tool
 *     switch.
 *
 * Nothing here performs I/O: callers read the bytes (a file head, a clipboard
 * blob, a fetched body) and pass them in. That keeps the module trivially
 * testable and usable from any host.
 */
/**
 * The raster image formats this kit can recognise from their leading bytes.
 *
 * Deliberately tiny — the agent only ever needs to tell PNG and JPEG apart for
 * its attachment / clipboard paths; anything else is reported as `unknown`
 * rather than guessed.
 */
export type ImageFormat = "png" | "jpeg";
/**
 * The IANA media types {@link ImageFormat} values map to.
 *
 * Used when a recognised format must be handed to the framework attachment
 * model, which speaks media-type strings.
 */
export type ImageMediaType = "image/png" | "image/jpeg";
/** The widest signature checked, so a caller knows the minimum head to read. */
export declare const IMAGE_SNIFF_BYTES: number;
/**
 * A byte source this module can read a leading window from.
 *
 * Both a Node `Uint8Array` / `Buffer` and a plain number array satisfy this, so
 * a caller never has to convert before sniffing.
 */
export type ByteSource = ArrayLike<number>;
/**
 * Classify a byte buffer as PNG or JPEG by its leading signature.
 *
 * Reads at most {@link IMAGE_SNIFF_BYTES} bytes from the front of `bytes` and
 * returns the matching {@link ImageFormat}, or `null` when neither signature
 * matches (an empty buffer, a truncated head, or any other format). Pure: it
 * inspects the buffer and allocates nothing.
 *
 * @param bytes the leading bytes of a candidate image (a file head is enough)
 */
export declare function sniffImageFormat(bytes: ByteSource): ImageFormat | null;
/** Map a recognised {@link ImageFormat} to its IANA media type. */
export declare function mediaTypeForImageFormat(format: ImageFormat): ImageMediaType;
/**
 * Detect the media type of a byte buffer, or `null` when unrecognised.
 *
 * A convenience over {@link sniffImageFormat} for callers that speak media-type
 * strings (e.g. the framework attachment model) rather than the internal
 * {@link ImageFormat} tag.
 *
 * @param bytes the leading bytes of a candidate image
 */
export declare function detectImageMediaType(bytes: ByteSource): ImageMediaType | null;
/** Whether `bytes` is a buffer this kit recognises as a supported image. */
export declare function isSupportedImage(bytes: ByteSource): boolean;
/**
 * The platform / architecture / version facts a {@link resolveAssetName}
 * template can interpolate.
 *
 * Field names mirror the substitution tokens; every member is optional so a
 * template that only references some of them can be rendered from a partial
 * context (a missing token resolves to an empty string).
 */
export interface AssetNameContext {
    /** The host operating system, e.g. `"darwin"` / `"linux"` / `"win32"`. */
    readonly platform?: string;
    /** The host CPU architecture, e.g. `"arm64"` / `"x64"`. */
    readonly arch?: string;
    /** The release version, e.g. `"1.2.3"` (with or without a leading `v`). */
    readonly version?: string;
    /** The bare tool / binary name, e.g. `"fd"` / `"rg"`. */
    readonly name?: string;
}
/**
 * Render a release-asset file name from a `{token}` template.
 *
 * Replaces each `{platform}` / `{arch}` / `{version}` / `{name}` occurrence with
 * the matching {@link AssetNameContext} field (an absent field becomes the empty
 * string), leaving every other character verbatim. This lets a provisioner
 * declare one template per tool — e.g. `"{name}-{version}-{arch}-{platform}.tar.gz"`
 * — instead of branching on the host. Pure string work, no I/O.
 *
 * @param template the asset-name pattern with `{token}` placeholders
 * @param context  the platform / arch / version / name facts to substitute
 */
export declare function resolveAssetName(template: string, context: AssetNameContext): string;
