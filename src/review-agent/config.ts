const SDSDSD_SUPABASE_URL = "https://bnaadeovgcqgbrnrfcef.supabase.co";

export interface ReviewAgentConfig {
  host: string;
  port: number;
  supabaseUrl: string;
  supabaseServiceKey: string;
  githubWebhookSecret: string;
  githubToken?: string;
  githubApp?: { appId: string; privateKey: string };
  modelId: string;
  pollIntervalMs: number;
  maxJobsPerTick: number;
  providerKeys: Readonly<Record<string, string>>;
}

const PROVIDER_ENV: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
  minimax: "MINIMAX_API_KEY",
  mistral: "MISTRAL_API_KEY",
  xai: "XAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  groq: "GROQ_API_KEY",
};

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

export function loadReviewAgentConfig(env: NodeJS.ProcessEnv = process.env): ReviewAgentConfig {
  const supabaseServiceKey = required(env, "SUPABASE_SERVICE_ROLE_KEY");
  const githubWebhookSecret = required(env, "GITHUB_WEBHOOK_SECRET");
  const githubToken = env.GITHUB_TOKEN?.trim();
  const appId = env.GITHUB_APP_ID?.trim();
  const privateKey = env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!githubToken && !(appId && privateKey)) {
    throw new Error("Configure GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY, or GITHUB_TOKEN for development");
  }

  const modelId = env.INDUSAGI_REVIEW_MODEL?.trim() || "anthropic/claude-sonnet-4-6";
  const provider = modelId.split("/", 1)[0];
  const providerEnv = PROVIDER_ENV[provider];
  if (providerEnv && !env[providerEnv]?.trim()) throw new Error(`${providerEnv} is required for ${modelId}`);

  const providerKeys: Record<string, string> = {};
  for (const [id, name] of Object.entries(PROVIDER_ENV)) {
    const value = env[name]?.trim();
    if (value) providerKeys[id] = value;
  }

  return {
    host: env.REVIEW_AGENT_HOST?.trim() || env.HOST?.trim() || "0.0.0.0",
    port: positiveInteger(env.REVIEW_AGENT_PORT ?? env.PORT, 8787, "REVIEW_AGENT_PORT"),
    supabaseUrl: env.SUPABASE_URL?.trim().replace(/\/$/, "") || SDSDSD_SUPABASE_URL,
    supabaseServiceKey,
    githubWebhookSecret,
    ...(githubToken ? { githubToken } : {}),
    ...(appId && privateKey ? { githubApp: { appId, privateKey } } : {}),
    modelId,
    pollIntervalMs: positiveInteger(env.REVIEW_AGENT_POLL_MS ?? env.REVIEW_POLL_INTERVAL_MS, 2_000, "REVIEW_AGENT_POLL_MS"),
    maxJobsPerTick: positiveInteger(env.REVIEW_AGENT_JOBS_PER_TICK ?? env.REVIEW_MAX_JOBS_PER_TICK, 5, "REVIEW_AGENT_JOBS_PER_TICK"),
    providerKeys,
  };
}
