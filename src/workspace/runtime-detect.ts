/**
 * Runtime / package-root detection.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The two shapes a launch can take, from the boot layer's point of view.
 */
export type Packaging = "compiled-binary" | "interpreted";

const BUN_VIRTUAL_FS_MARKERS = ["$bunfs", "~BUN", "%7EBUN"];

/**
 * The lone probe over an `import.meta.url`-shaped string.
 */
export function detectPackagingFromModuleUrl(moduleUrl: string): Packaging {
  const carriesVirtualFsMarker = BUN_VIRTUAL_FS_MARKERS.some((marker) =>
    moduleUrl.includes(marker),
  );
  return carriesVirtualFsMarker ? "compiled-binary" : "interpreted";
}

/**
 * Whether the current process is a Bun-compiled standalone binary.
 */
export function isPackagedBinary(): boolean {
  return detectPackagingFromModuleUrl(import.meta.url) === "compiled-binary";
}

function moduleDirectory(): string {
  return dirname(fileURLToPath(import.meta.url));
}

interface RootStrategy {
  id: string;
  claims: (packaging: Packaging) => boolean;
  locate: () => string;
}

const ROOT_STRATEGIES: RootStrategy[] = [
  {
    id: "next-to-executable",
    claims: (packaging) => packaging === "compiled-binary",
    locate: () => dirname(process.execPath),
  },
  {
    id: "module-enclosing-dir",
    claims: () => true,
    locate: () => moduleDirectory(),
  },
];

/**
 * Resolve the absolute package-root directory for the active launch.
 */
export function resolvePackageRoot(): string {
  const packaging = detectPackagingFromModuleUrl(import.meta.url);
  const strategy = ROOT_STRATEGIES.find((candidate) => candidate.claims(packaging));
  if (!strategy) {
    return moduleDirectory();
  }
  return strategy.locate();
}