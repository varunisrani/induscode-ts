/**
 * Slice planner — decides *where* to cut the transcript when it is over budget.
 */
import type { AgentMessage, BudgetPolicy, CondensePlan } from "../contract.js";
import { prefixTokens } from "./estimate.js";

function isRecord2(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLegalTailStart(message: AgentMessage): boolean {
  return !(isRecord2(message) && (message as { role?: string }).role === "toolResult");
}

function snapForward(messages: AgentMessage[], candidate: number): number {
  let cut = candidate;
  while (cut < messages.length && !isLegalTailStart(messages[cut])) cut++;
  return cut;
}

function lowerBound(prefix: number[], threshold: number): number {
  let lo = 0;
  let hi = prefix.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (prefix[mid] >= threshold) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/**
 * Plan the condense slice for a transcript under a {@link BudgetPolicy}.
 */
export function planSlice(messages: AgentMessage[], policy: BudgetPolicy): CondensePlan {
  const n = messages.length;
  if (n === 0) {
    return { cut: 0, kept: [], dropped: [] };
  }
  const prefix = prefixTokens(messages);
  const total = prefix[n];
  if (total <= policy.keepRecent) {
    return { cut: 0, kept: messages.slice(0), dropped: [] };
  }
  const threshold = total - policy.keepRecent;
  const ideal = lowerBound(prefix, threshold);
  const cut = snapForward(messages, ideal);
  if (cut >= n) {
    return { cut: 0, kept: messages.slice(0), dropped: [] };
  }
  return {
    cut,
    kept: messages.slice(cut),
    dropped: messages.slice(0, cut),
  };
}