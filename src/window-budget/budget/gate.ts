/**
 * Budget gate — the trigger predicate for the window-budget subsystem.
 *
 * {@link isOverBudget} answers the single question "is the transcript large
 * enough that we should condense before the next turn?" by comparing a token
 * estimate against a window-relative threshold derived from the model's
 * `contextWindow` and the caller-supplied {@link BudgetPolicy}.
 */
import type { AgentMessage, BudgetPolicy, Model } from "../contract.js";
import type { Api } from "indusagi/ai";
import { estimateTokens } from "./estimate.js";

/**
 * Compute the absolute token limit at which condensing should fire for a given
 * model and policy.
 */
export function budgetLimit(model: Model<Api>, policy: BudgetPolicy): number {
  const reserve = policy.reserveTokens ?? 0;
  const usable = Math.max(0, model.contextWindow - reserve);
  return usable * policy.triggerRatio;
}

/**
 * Decide whether the transcript is over budget for the given model and policy.
 */
export function isOverBudget(
  messages: AgentMessage[],
  model: Model<Api>,
  policy: BudgetPolicy,
): boolean {
  const estimate = estimateTokens(messages);
  return estimate > budgetLimit(model, policy);
}