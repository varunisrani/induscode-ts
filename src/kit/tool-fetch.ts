// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Tool-fetch kit — a managed-binary provisioner stub for the native helpers the
 * agent shells out to (a fast file finder and a fast content grep, fd / rg).
 *
 * The agent prefers native binaries when present and otherwise provisions them
 * from a project release page into a managed directory. This module owns the
 * *resolution and URL-building* half of that flow as a small, injectable stub:
 *
 *   - {@link resolveManagedBinaryPath} computes where a managed binary lives on
 *     disk (the managed `bin/` directory + the platform-correct file name),
 *     without touching the filesystem;
 *   - {@link pickReleaseAsset} selects the right release asset for the host by
 *     matching a per-tool {@link RegExp} against the asset names a release
 *     exposes — a regex matcher rather than a per-tool string switch;
 *   - {@link buildDownloadRequest} renders the asset download URL plus the
 *     outbound request headers, stamping this kit's own {@link KIT_USER_AGENT}.
 *
 * The network is *optional and injectable*: nothing here calls `fetch`. A caller
 * supplies a {@link ReleaseLookup} (e.g. backed by a release REST endpoint, a
 * fixture, or a cache) and this module turns its result into a concrete request.
 * That keeps the module pure, host-agnostic, and trivially testable offline.
 */
/**
 * The `User-Agent` this kit stamps on every outbound provisioning request.
 *
 * A fresh, self-describing token owned by this module — release hosts expect a
 * non-empty agent string, and a distinctive one keeps the agent's traffic
 * identifiable in server logs. Versioned so the string can move with the kit.
 */
export declare const KIT_USER_AGENT = "indusagi-kit-provisioner/1.0";
/**
 * A declarative description of one provisionable native helper.
 *
 * The provisioner is driven entirely off an array of these: there is no
 * per-tool branch anywhere in the flow. {@link assetMatcher} is the load-bearing
 * field — a {@link RegExp} tested against each candidate asset name to pick the
 * host build, replacing the old per-platform name templates.
 */
export interface ToolDescriptor {
    /** The bare binary name the agent invokes, e.g. `"fd"` / `"rg"`. */
    readonly bin: string;
    /** The owner/repo coordinate the release is fetched from, e.g. `"owner/tool"`. */
    readonly repo: string;
    /**
     * A regex selecting this tool's asset for the *current host* from a release's
     * asset list. The caller composes platform / arch fragments into the pattern;
     * the matcher then does the selection, so adding a tool is data, not code.
     */
    readonly assetMatcher: RegExp;
}
/**
 * Compute the on-disk path of a managed binary without touching the filesystem.
 *
 * Joins the managed binaries directory with the platform-correct executable
 * name — the bare `bin` name on POSIX, the same name with a `.exe` suffix on
 * Windows. Pure: it builds a string and never stats the path, so a caller can
 * decide separately whether the binary is actually present.
 *
 * @param binDir   the managed binaries directory (e.g. the workspace `bin/`)
 * @param bin      the bare binary name, e.g. `"fd"`
 * @param platform the host platform tag (defaults to `process.platform`)
 */
export declare function resolveManagedBinaryPath(binDir: string, bin: string, platform?: NodeJS.Platform): string;
/**
 * One downloadable asset on a release, reduced to the two fields the matcher
 * and the request builder need.
 */
export interface ReleaseAsset {
    /** The asset file name matched against a {@link ToolDescriptor.assetMatcher}. */
    readonly name: string;
    /** The fully-qualified URL the asset bytes are fetched from. */
    readonly url: string;
}
/**
 * A resolved release: its tag and the assets it exposes.
 *
 * Whatever produces this — a live REST call, a fixture, a cache — is the
 * caller's concern; this module only consumes the shape.
 */
export interface ReleaseInfo {
    /** The release tag, e.g. `"v1.2.3"`; surfaced for path / version templating. */
    readonly tag: string;
    /** Every downloadable asset on the release. */
    readonly assets: readonly ReleaseAsset[];
}
/**
 * The injected, optional network boundary.
 *
 * A caller supplies a function that resolves a `owner/repo` coordinate to its
 * latest {@link ReleaseInfo}. This module never imports a HTTP client; the
 * lookup is the single seam where real network access (or a stub) is plugged
 * in, keeping {@link buildDownloadRequest} pure and offline-testable.
 */
export type ReleaseLookup = (repo: string) => Promise<ReleaseInfo>;
/**
 * Select the release asset matching a tool's {@link ToolDescriptor.assetMatcher}.
 *
 * Tests each asset name against the descriptor's regex and returns the first
 * match, or `null` when no asset fits the host (a release that lacks a build for
 * this platform / arch). Pure: it filters the supplied list and performs no I/O.
 *
 * @param descriptor the tool whose asset is being located
 * @param release    the release whose assets are searched
 */
export declare function pickReleaseAsset(descriptor: ToolDescriptor, release: ReleaseInfo): ReleaseAsset | null;
/**
 * A ready-to-issue download request: the URL plus the outbound headers.
 *
 * The caller hands this to whatever HTTP client it owns; this module builds it
 * but never sends it (the network stays injectable).
 */
export interface DownloadRequest {
    /** The asset URL to fetch. */
    readonly url: string;
    /** The asset file name (useful for the unpack / install step). */
    readonly assetName: string;
    /** The outbound request headers, including this kit's {@link KIT_USER_AGENT}. */
    readonly headers: Readonly<Record<string, string>>;
}
/**
 * Render the download request for a selected release asset.
 *
 * Stamps the kit {@link KIT_USER_AGENT} and an octet-stream `Accept` so the
 * release host returns the raw asset rather than a metadata document, then
 * carries through the asset URL and name. Pure string assembly — issuing the
 * request is the caller's job.
 *
 * @param asset the asset chosen by {@link pickReleaseAsset}
 */
export declare function buildDownloadRequest(asset: ReleaseAsset): DownloadRequest;
/**
 * A computed provisioning plan for one tool: where the binary should land and
 * how to fetch its bytes.
 *
 * This is the stub's terminal value — everything needed to perform the install
 * (download to {@link DownloadRequest.url}, unpack, move to
 * {@link targetPath}, mark executable) without this module performing any of it.
 */
export interface ProvisionPlan {
    /** The bare binary name being provisioned. */
    readonly bin: string;
    /** Where the installed binary should live (from {@link resolveManagedBinaryPath}). */
    readonly targetPath: string;
    /** The release tag the plan was built against. */
    readonly tag: string;
    /** The request that fetches the matching asset for the host. */
    readonly download: DownloadRequest;
}
/**
 * Build a {@link ProvisionPlan} for a tool by looking up its latest release and
 * selecting the host asset.
 *
 * Resolves the release through the injected {@link ReleaseLookup}, picks the
 * asset via {@link pickReleaseAsset}, and assembles the on-disk target path and
 * the download request. The network touch is entirely the caller-supplied
 * `lookup`; this function adds no I/O of its own. Returns `null` when the
 * release exposes no asset for the host, so a caller can fall back to a
 * system-installed binary.
 *
 * @param descriptor the tool to provision
 * @param binDir     the managed binaries directory the binary installs into
 * @param lookup     the injected release resolver (the only network seam)
 * @param platform   the host platform tag (defaults to `process.platform`)
 */
export declare function planProvision(descriptor: ToolDescriptor, binDir: string, lookup: ReleaseLookup, platform?: NodeJS.Platform): Promise<ProvisionPlan | null>;
