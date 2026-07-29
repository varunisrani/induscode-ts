/**
 * Tool-fetch kit — a managed-binary provisioner stub for the native helpers the
 * agent shells out to (a fast file finder and a fast content grep, fd / rg).
 */
import { join } from "node:path";

export const KIT_USER_AGENT = "indusagi-kit-provisioner/1.0";

export interface ToolDescriptor {
  readonly bin: string;
  readonly repo: string;
  readonly assetMatcher: RegExp;
}

export function resolveManagedBinaryPath(
  binDir: string,
  bin: string,
  platform: NodeJS.Platform = process.platform,
): string {
  const fileName = platform === "win32" ? `${bin}.exe` : bin;
  return join(binDir, fileName);
}

export interface ReleaseAsset {
  readonly name: string;
  readonly url: string;
}

export interface ReleaseInfo {
  readonly tag: string;
  readonly assets: readonly ReleaseAsset[];
}

export type ReleaseLookup = (repo: string) => Promise<ReleaseInfo>;

export function pickReleaseAsset(
  descriptor: ToolDescriptor,
  release: ReleaseInfo,
): ReleaseAsset | null {
  for (const asset of release.assets) {
    if (descriptor.assetMatcher.test(asset.name)) return asset;
  }
  return null;
}

export interface DownloadRequest {
  readonly url: string;
  readonly assetName: string;
  readonly headers: Readonly<Record<string, string>>;
}

export function buildDownloadRequest(asset: ReleaseAsset): DownloadRequest {
  return {
    url: asset.url,
    assetName: asset.name,
    headers: {
      "User-Agent": KIT_USER_AGENT,
      Accept: "application/octet-stream",
    },
  };
}

export interface ProvisionPlan {
  readonly bin: string;
  readonly targetPath: string;
  readonly tag: string;
  readonly download: DownloadRequest;
}

export async function planProvision(
  descriptor: ToolDescriptor,
  binDir: string,
  lookup: ReleaseLookup,
  platform: NodeJS.Platform = process.platform,
): Promise<ProvisionPlan | null> {
  const release = await lookup(descriptor.repo);
  const asset = pickReleaseAsset(descriptor, release);
  if (asset === null) return null;
  return {
    bin: descriptor.bin,
    targetPath: resolveManagedBinaryPath(binDir, descriptor.bin, platform),
    tag: release.tag,
    download: buildDownloadRequest(asset),
  };
}