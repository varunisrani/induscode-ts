/**
 * Zoho integration for indusagi-coding-agent.
 *
 * Consumes `indusagi/zoho` from the local framework package.
 */

export type { ZohoHostConfig, ZohoAttachResult } from "./types.js";
export {
  resolveZohoConfig,
  saveZohoConfig,
  profileZohoPath,
  projectZohoPath,
  redactUrl,
} from "./config.js";
export type { ResolveZohoOptions } from "./config.js";
export {
  attachZohoTools,
  loadZohoAgentTools,
  disconnectLiveZoho,
  getLiveZoho,
  zohoStatusLines,
  zohoOAuthPendingText,
  isZohoConnecting,
  getLastZohoAuthUrl,
  hasUsableZohoTokens,
} from "./attach.js";
export type { AttachZohoOptions } from "./attach.js";
