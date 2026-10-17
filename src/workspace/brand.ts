/**
 * Brand record — the single source of truth for every identity literal.
 *
 * One frozen {@link Brand} value. Nothing else in the app hard-codes the
 * product name, the profile-directory leaf, the bin names, the env-var
 * namespace, or the share-viewer origin.
 */
import type { Brand } from "../boot/contract.js";

/**
 * The concrete indusagi identity.
 */
export const BRAND: Brand = Object.freeze({
  name: "indusagi",
  label: "indusagi",
  profileDirName: ".indusagi",
  stateDirName: "agent",
  binNames: ["indus", "indusagi"],
  envPrefix: "INDUSAGI",
  envProfileDir: "INDUSAGI_CODING_AGENT_DIR",
  envDebug: "INDUSAGI_DEBUG",
  envShareViewer: "INDUSAGI_SHARE_VIEWER_URL",
  shareViewerUrl: "https://buildwithindusagi.ai/session/",
});

/**
 * The product version — printed by `--version` and shown on the startup banner.
 */
export const VERSION = "0.2.14";