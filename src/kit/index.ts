// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Kit subsystem — public barrel.
 *
 * `kit/` holds the agent's framework-agnostic leaf helpers: small, pure, Node-
 * builtin-only utilities with no dependency on the framework or on any sibling
 * subsystem. It re-exports three groups:
 *
 *   - **tool-fetch** — the managed-binary provisioner stub (fd / rg): managed
 *     path resolution, regex-driven release-asset selection, and a download-
 *     request builder stamped with this kit's own {@link KIT_USER_AGENT}. The
 *     network is injected, never imported.
 *   - **image** — PNG / JPEG magic-byte sniffing (interface-dictated
 *     signatures) and the `{token}` asset-name renderer.
 *   - **shell** — POSIX shell-argument quoting and command assembly.
 *
 * Consumers import from `src/kit` rather than reaching into individual modules.
 * The upstream filler libraries (generic array / string / date / json / etc.
 * stdlib clones) are intentionally omitted: they had zero consumers, so they
 * are not rebuilt here.
 */
export type { ToolDescriptor, ReleaseAsset, ReleaseInfo, ReleaseLookup, DownloadRequest, ProvisionPlan, } from "./tool-fetch";
export { KIT_USER_AGENT, resolveManagedBinaryPath, pickReleaseAsset, buildDownloadRequest, planProvision, } from "./tool-fetch";
export type { ImageFormat, ImageMediaType, ByteSource, AssetNameContext, } from "./image";
export { IMAGE_SNIFF_BYTES, sniffImageFormat, mediaTypeForImageFormat, detectImageMediaType, isSupportedImage, resolveAssetName, } from "./image";
export { quoteArg, needsQuoting, buildShellCommand, } from "./shell";
export type { ClipboardImageOptions, } from "./clipboard-image";
export { readClipboardImage, } from "./clipboard-image";
export type { ExternalEditorOptions, } from "./external-editor";
export { openInExternalEditor, } from "./external-editor";
