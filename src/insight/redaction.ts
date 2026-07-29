/**
 * Secret redaction — the attribute processor the pipeline runs before a sink.
 */
import {
  REDACTED_TOKEN,
  type Probe,
  type ProbeAttributes,
  type ProbeFault,
  type RedactionOptions,
  type RedactionRule,
  type SecretRedactor,
} from "./contract.js";

const SECRET_KEY_FRAGMENTS = [
  "apikey",
  "api_key",
  "secret",
  "password",
  "passwd",
  "authorization",
  "auth_token",
  "access_token",
  "refresh_token",
  "session_token",
  "private_key",
  "credential",
  "cookie",
  "set-cookie",
  "bearer",
];

const SECRET_KEY_PATTERN = new RegExp(`(${SECRET_KEY_FRAGMENTS.join("|")})`, "i");

const SECRET_VALUE_PATTERNS: RegExp[] = [
  /\b(?:Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{8,}/g,
  /\b[a-z]{1,5}-(?:live|test|proj)?[-_]?[A-Za-z0-9]{16,}\b/g,
  /\b(?:gh[opsu]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  /\bAKIA[0-9A-Z]{12,}\b/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  /-----BEGIN[ A-Z]*PRIVATE KEY-----[\s\S]*?-----END[ A-Z]*PRIVATE KEY-----/g,
];

export const DEFAULT_REDACTION_RULES: readonly RedactionRule[] = Object.freeze([
  Object.freeze({ id: "secret-key", key: SECRET_KEY_PATTERN }),
  ...SECRET_VALUE_PATTERNS.map((value, i) =>
    Object.freeze({ id: `secret-value-${i + 1}`, value }),
  ),
]);

const DEFAULT_MAX_STRING_LENGTH = 4096;
const TRUNCATION_SUFFIX = "...[insight:truncated]";

function keyMatches(rule: RedactionRule, key: string): boolean {
  const matcher = rule.key;
  if (matcher === undefined) return false;
  if (typeof matcher === "string") {
    return key.toLowerCase().includes(matcher.toLowerCase());
  }
  return matcher.test(key);
}

function applyValueRules(rules: readonly RedactionRule[], text: string): string {
  let out = text;
  for (const rule of rules) {
    const pattern = rule.value;
    if (pattern === undefined) continue;
    if (pattern.global || pattern.sticky) pattern.lastIndex = 0;
    out = out.replace(pattern, REDACTED_TOKEN);
  }
  return out;
}

export function createRedactor(
  rules: readonly RedactionRule[] = DEFAULT_REDACTION_RULES,
  options: RedactionOptions = {},
): SecretRedactor {
  const frozenRules = Object.freeze([...rules]);
  const maxLen = options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;
  const omit = new Set((options.omitKeys ?? []).map((k) => k.toLowerCase()));

  function isOmitted(key: string): boolean {
    return omit.has(key.toLowerCase());
  }

  function isSecretKey(key: string): boolean {
    for (const rule of frozenRules) {
      if (keyMatches(rule, key)) return true;
    }
    return false;
  }

  function capLength(text: string): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + TRUNCATION_SUFFIX;
  }

  function scrubNode(value: unknown, key: string | undefined): unknown {
    if (key !== undefined && isSecretKey(key)) {
      return REDACTED_TOKEN;
    }
    if (typeof value === "string") {
      return capLength(applyValueRules(frozenRules, value));
    }
    if (Array.isArray(value)) {
      return Object.freeze(value.map((item) => scrubNode(item, undefined)));
    }
    if (value !== null && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (isOmitted(k)) continue;
        out[k] = scrubNode(v, k);
      }
      return Object.freeze(out);
    }
    return value;
  }

  function scrubValue(value: unknown): unknown {
    return scrubNode(value, undefined);
  }

  function scrubAttributes(attributes: ProbeAttributes): ProbeAttributes {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(attributes)) {
      if (isOmitted(k)) continue;
      out[k] = scrubNode(v, k);
    }
    return Object.freeze(out);
  }

  function scrubFault(fault: ProbeFault): ProbeFault {
    const scrubbed: { message: string; name?: string; stack?: string } = {
      message: capLength(applyValueRules(frozenRules, fault.message)),
    };
    if (fault.name !== undefined) scrubbed.name = fault.name;
    if (fault.stack !== undefined) scrubbed.stack = capLength(applyValueRules(frozenRules, fault.stack));
    return Object.freeze(scrubbed);
  }

  function scrub(probe: Probe): Probe {
    const next: Probe = {
      ...probe,
      attributes: scrubAttributes(probe.attributes),
      ...(probe.fault !== undefined ? { fault: scrubFault(probe.fault) } : {}),
    };
    return Object.freeze(next);
  }

  return Object.freeze({
    rules: frozenRules,
    scrubValue,
    scrubAttributes,
    scrub,
  });
}

export const DEFAULT_REDACTOR: SecretRedactor = createRedactor();