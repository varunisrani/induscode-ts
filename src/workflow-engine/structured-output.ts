import type { Static, TSchema } from "@sinclair/typebox";
import type { AgentTool } from "../capability-deck/index.js";

export interface StructuredOutputCapture<T = unknown> {
  value: T | undefined;
  called: boolean;
}

export interface StructuredOutputToolOptions<TSchemaDef extends TSchema> {
  schema: TSchemaDef;
  capture: StructuredOutputCapture<Static<TSchemaDef>>;
  name?: string;
}

export function createStructuredOutputTool<TSchemaDef extends TSchema>({
  schema,
  capture,
  name = "structured_output",
}: StructuredOutputToolOptions<TSchemaDef>): AgentTool<TSchemaDef, Static<TSchemaDef>> {
  return {
    name,
    label: "Structured Output",
    description: "Return the final machine-readable result for this subagent task.",
    readOnly: true,
    parameters: schema,
    async execute(_toolCallId, params) {
      capture.value = params;
      capture.called = true;
      return {
        content: [{ type: "text", text: "Structured output received." }],
        details: params,
      };
    },
  };
}
