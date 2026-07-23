/**
 * Zoho host config for the coding agent.
 */

export interface ZohoHostConfig {
  /** Zoho MCP server URL from the Connect tab. */
  readonly url: string;
  /** Tool prefix / credential id (default: zoho). */
  readonly id?: string;
  /** When false, skip attach even if URL is set. */
  readonly enabled?: boolean;
  /** Auth mode for connectZohoMcp (default: auto). */
  readonly auth?: "auto" | "oauth" | "none";
}

export interface ZohoAttachResult {
  readonly tools: readonly unknown[];
  readonly toolNames: readonly string[];
  readonly id: string;
  close(): Promise<void>;
}
