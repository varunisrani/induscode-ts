import { Agent } from "indusagi/agent";
// Local alias: `indusagi/agent` does not export `AgentEvent` from the top
// level, so we declare a structural placeholder the subscriber callback can
// accept. Concrete fields are read off the event via narrow type guards.
export type AgentEvent =
  | { type: "tool_execution_start"; toolName: string; [k: string]: unknown }
  | { type: "tool_execution_end"; toolName?: string; [k: string]: unknown }
  | { type: "turn_end"; message: unknown; [k: string]: unknown }
  | { type: string; [k: string]: unknown };
import {
  ModelCatalog,
  ModelMatcher,
  createSubagentPermissionGate,
  withGatewayBaseUrl,
  type AgentMessage,
  type SessionPermissionPolicy,
} from "../conductor/index.js";
import { provisionDeck, type AgentTool } from "../capability-deck/index.js";
import { createStructuredOutputTool } from "./structured-output.js";
import type { WorkflowAgentRunOptions, WorkflowAgentRunner } from "./engine.js";

export interface WorkflowSubAgent {
  prompt(input: string): Promise<void>;
  abort(): void;
  subscribe?(fn: (event: AgentEvent) => void): () => void;
  readonly state: {
    messages: readonly AgentMessage[];
    error?: string;
    usage?: unknown;
  };
}

export interface WorkflowSpawnContext {
  readonly tools: AgentTool[];
  readonly systemPrompt: string;
}

export interface WorkflowAgentRunnerOptions {
  readonly modelId: string;
  readonly cwd: string;
  readonly getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
  readonly system?: string;
  readonly spawn?: (prompt: string, context: WorkflowSpawnContext) => WorkflowSubAgent;
  readonly getGatewayBaseUrls?: () => Promise<Record<string, string>>;
  readonly permissionPolicy?: SessionPermissionPolicy;
}

export const DEFAULT_WORKFLOW_SYSTEM =
  "You are a focused workflow subagent. You run your own tool loop to accomplish one self-contained task and report a single result. You do not share the parent conversation history, so work only from the task prompt and the tools available to you.";

export const STRUCTURED_CONTRACT = [
  "Final output contract:",
  "- Your final action MUST be a structured_output tool call.",
  "- The structured_output arguments are the return value of this subagent.",
  "- Do not emit a prose final answer instead of structured_output.",
  "- If you need to inspect files or run commands first, do so, then call structured_output exactly once.",
].join("\n");

export function finalAssistantText(messages: readonly AgentMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "assistant") continue;
    const content = message.content;
    if (!Array.isArray(content)) return typeof content === "string" ? content : "";
    return content
      .filter((block): block is { type: "text"; text: string } =>
        Boolean(block) && typeof block === "object" && block.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("");
  }
  return "";
}

function usageOf(value: unknown): { input: number; output: number } {
  let usage = value;
  if (typeof value === "object" && value !== null && "usage" in value && value.usage != null) usage = value.usage;
  const input = typeof usage === "object" && usage !== null && "input" in usage && typeof usage.input === "number"
    ? usage.input : 0;
  const output = typeof usage === "object" && usage !== null && "output" in usage && typeof usage.output === "number"
    ? usage.output : 0;
  return { input, output };
}

export function buildPrompt(prompt: string, options: WorkflowAgentRunOptions, structured: boolean): string {
  return [
    options.instructions,
    options.label ? `Task label: ${options.label}` : undefined,
    prompt,
    structured ? STRUCTURED_CONTRACT : undefined,
  ].filter((part): part is string => Boolean(part)).join("\n\n");
}

export function createWorkflowAgentRunner(opts: WorkflowAgentRunnerOptions): WorkflowAgentRunner {
  const matcher = new ModelMatcher(new ModelCatalog());
  const system = opts.system ?? DEFAULT_WORKFLOW_SYSTEM;
  return {
    async run(prompt, options) {
      if (options.signal?.aborted) throw new Error("workflow subagent aborted");
      const structured = options.schema !== undefined;
      const capture: { called: boolean; value: unknown } = { called: false, value: undefined };
      const model = matcher.resolveCard(options.model ?? opts.modelId)?.model;
      const buildTools = () => {
        const tools = provisionDeck("authoring", { cwd: opts.cwd }).tools();
        if (structured) {
          tools.push(createStructuredOutputTool({ schema: options.schema as never, capture }));
        }
        return tools;
      };
      const fullPrompt = buildPrompt(prompt, options, structured);
      let agent: WorkflowSubAgent;
      if (opts.spawn) {
        agent = opts.spawn(fullPrompt, { tools: buildTools(), systemPrompt: system });
      } else {
        if (model === undefined) throw new Error(`no model resolved for workflow subagent: ${options.model ?? opts.modelId}`);
        const gatewayBaseUrls = await opts.getGatewayBaseUrls?.();
        const tools = buildTools();
        agent = new Agent({
          initialState: {
            model: withGatewayBaseUrl(model, gatewayBaseUrls),
            systemPrompt: system,
            tools,
          },
          ...(opts.getApiKey ? { getApiKey: opts.getApiKey } : {}),
          ...(opts.permissionPolicy !== undefined
            ? { canUseTool: createSubagentPermissionGate(opts.permissionPolicy, tools) }
            : {}),
        }) as WorkflowSubAgent;
      }
      const activity = { tokensIn: 0, tokensOut: 0, toolCount: 0, currentTool: undefined as string | undefined, lastTool: undefined as string | undefined };
      let unsubscribe: (() => void) | undefined;
      if (options.onActivity && typeof agent.subscribe === "function") {
        const report = () => options.onActivity?.({ ...activity });
        unsubscribe = agent.subscribe((event) => {
          switch (event.type) {
            case "tool_execution_start":
              activity.toolCount++;
              activity.currentTool = event.toolName;
              report();
              break;
            case "tool_execution_end":
              activity.lastTool = activity.currentTool ?? event.toolName;
              activity.currentTool = undefined;
              report();
              break;
            case "turn_end": {
              const usage = usageOf(event.message);
              activity.tokensIn += usage.input;
              activity.tokensOut += usage.output;
              report();
              break;
            }
          }
        });
      }
      const onAbort = () => agent.abort();
      options.signal?.addEventListener("abort", onAbort, { once: true });
      try {
        await agent.prompt(fullPrompt);
      } finally {
        options.signal?.removeEventListener("abort", onAbort);
        unsubscribe?.();
      }
      if (options.onActivity) {
        const finalUsage = usageOf(agent.state.usage);
        if (finalUsage.input > 0 || finalUsage.output > 0) {
          activity.tokensIn = finalUsage.input;
          activity.tokensOut = finalUsage.output;
        }
        activity.currentTool = undefined;
        options.onActivity({ ...activity });
      }
      if (options.signal?.aborted) throw new Error("workflow subagent aborted");
      if (agent.state.error !== undefined) throw new Error(agent.state.error);
      if (structured) {
        if (!capture.called) throw new Error("workflow subagent finished without calling structured_output");
        return capture.value;
      }
      return finalAssistantText(agent.state.messages);
    },
  };
}
