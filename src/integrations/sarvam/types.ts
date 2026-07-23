/**
 * Sarvam host config for the coding agent.
 */

export interface SarvamHostConfig {
  /** Sarvam dashboard API key. Optional if SARVAM_API_KEY is in env. */
  readonly apiKey?: string;
  /** Tool prefix / id (default: sarvam). */
  readonly id?: string;
  /** When false, skip attach even if key is set. */
  readonly enabled?: boolean;
  /** Override Sarvam API base URL. */
  readonly baseUrl?: string;
  /** Where TTS/docs files land (default ~/Desktop). */
  readonly basePath?: string;
  /** Subprocess command (default: uvx). */
  readonly command?: string;
  /** Subprocess args (default: ["sarvam-mcp"]). */
  readonly args?: readonly string[];
}

export interface SarvamAttachResult {
  readonly tools: readonly unknown[];
  readonly toolNames: readonly string[];
  readonly id: string;
  close(): Promise<void>;
}
