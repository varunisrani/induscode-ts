const QUOTA_MARKER = "quota_exceeded";

function collectErrorSignals(error: unknown): { statuses: number[]; text: string } {
  const statuses: number[] = [];
  const parts: string[] = [];
  const seen = new Set<object>();
  const visit = (value: unknown, depth: number): void => {
    if (value == null || depth > 6) return;
    if (typeof value === "string") { parts.push(value); return; }
    if (typeof value === "number") { statuses.push(value); return; }
    if (typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    const object = value as Record<string, unknown>;
    for (const key of ["status", "statusCode", "code"]) {
      const raw = object[key];
      if (typeof raw === "number") statuses.push(raw);
      else if (typeof raw === "string" && /^\d+$/.test(raw)) statuses.push(Number(raw));
    }
    if (typeof object.message === "string") parts.push(object.message);
    visit(object.cause, depth + 1);
    visit(object.error, depth + 1);
    visit(object.response, depth + 1);
    visit(object.body, depth + 1);
    visit(object.data, depth + 1);
  };
  visit(error, 0);
  try { parts.push(JSON.stringify(error)); } catch { /* ignore circular data */ }
  if (error instanceof Error && typeof error.stack === "string") parts.push(error.stack);
  return { statuses, text: parts.join(" \u0001 ").toLowerCase() };
}

export function isQuotaFault(error: unknown): boolean {
  const { statuses, text } = collectErrorSignals(error);
  if (!text.includes(QUOTA_MARKER)) return false;
  return statuses.includes(429) || text.includes(QUOTA_MARKER);
}

function parseUsedLimit(text: string): { used: number; limit: number } | undefined {
  const used = text.match(/"used"\s*:\s*(\d+)/);
  const limit = text.match(/"limit"\s*:\s*(\d+)/);
  return used && limit ? { used: Number(used[1]), limit: Number(limit[1]) } : undefined;
}

export function quotaErrorMessage(error: unknown): string | undefined {
  if (!isQuotaFault(error)) return undefined;
  const numbers = parseUsedLimit(collectErrorSignals(error).text);
  const usage = numbers ? ` (${numbers.used}/${numbers.limit} tokens this month)` : "";
  return `You've hit your indus usage limit${usage}. Add your own API key with \`indus signin <provider>\`, or upgrade your plan.`;
}
