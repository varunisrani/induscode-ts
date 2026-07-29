/**
 * Window-budget — the condenser factory (the conductor-consumable seam).
 *
 * {@link createCondenser} ties the three pure pieces together into a single
 * function the conductor can drop into its auto-compaction hook.
 */
import type {
  AgentMessage,
  BudgetPolicy,
  Condenser,
  CondenserDeps,
  Summary,
} from "./contract.js";
import { isOverBudget } from "./budget/gate.js";
import { planSlice } from "./budget/slice.js";
import { condenseScope, summarize, type SummarizeDeps } from "./summarize/index.js";

/**
 * The fallback {@link BudgetPolicy} when the caller supplies none.
 */
export const AUTO_CONDENSE_POLICY: BudgetPolicy = {
  triggerRatio: 0.75,
  keepRecent: 6e3,
  reserveTokens: 2048,
};

/**
 * Build a {@link Condenser} from a {@link CondenserDeps} bundle. The result plugs
 * straight into the conductor's `CondenseFn` seam.
 */
export function createCondenser(deps: CondenserDeps = {}): Condenser {
  const policy = deps.policy ?? AUTO_CONDENSE_POLICY;
  const model = deps.model;
  const complete = deps.complete;
  return async (messages: AgentMessage[]): Promise<AgentMessage[]> => {
    if (!model) return messages;
    if (!isOverBudget(messages, model, policy)) return messages;
    const plan = planSlice(messages, policy);
    if (plan.cut === 0 || plan.dropped.length === 0) {
      return messages;
    }
    const summary = await summarize(plan.dropped, { complete, model });
    return [summary.message, ...plan.kept];
  };
}

/**
 * Session-scope summarization: fold a slice of dropped messages into one digest
 * for the active session.
 */
export function condense(
  messages: AgentMessage[],
  deps: Omit<SummarizeDeps, "scope"> = {},
): Promise<Summary> {
  return summarize(messages, { ...deps, scope: "session" });
}

export { condenseScope };