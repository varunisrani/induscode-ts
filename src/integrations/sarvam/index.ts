/**
 * Sarvam integration for indusagi-coding-agent.
 *
 * Consumes `indusagi/sarvam-mcp` from the local framework package.
 */

export type { SarvamHostConfig, SarvamAttachResult } from "./types.js";
export {
  resolveSarvamConfig,
  saveSarvamConfig,
  profileSarvamPath,
  projectSarvamPath,
  redactApiKey,
} from "./config.js";
export type { ResolveSarvamOptions } from "./config.js";
export {
  attachSarvamTools,
  loadSarvamAgentTools,
  disconnectLiveSarvam,
  getLiveSarvam,
  sarvamStatusLines,
  sarvamConnectingText,
  isSarvamConnecting,
} from "./attach.js";
export type { AttachSarvamOptions } from "./attach.js";
