/**
 * Boot helper: activate the addon host for a session and fold its tool
 * interceptors around the deck.
 *
 * The {@link createAddonHost addon host} is the product's extension mechanism —
 * locally-authored modules under `<cwd>/.indus/addons` that graft tools, slash
 * commands, lifecycle observers, and tool-boundary interceptors onto a running
 * session. The host itself is fully built and tested, but until this module it
 * was never *instantiated* outside its own unit tests: nothing in the boot path
 * discovered, loaded, or wired addons.
 *
 * This module closes that gap with two narrow seams the runners call once at
 * session-assembly time:
 *
 *   1. {@link buildAddonHost} — construct a host, swallow its fault stream (a
 *      broken addon must never sink the session), and {@link AddonHost.loadAll
 *      load} every addon discovered under the run's `.indus/addons` directory.
 *      With no such directory the returned {@link AddonSurfaceBundle} is empty —
 *      no interceptors, no contributed tools — so wiring it is a perfect no-op.
 *   2. {@link wrapToolsWithAddons} — fold the bundle's
 *      {@link InterceptorChain} around every tool whose name a stage matches,
 *      leaving the rest identity-equal. A wrapped tool runs the chain's
 *      `enter` → real `execute` → `exit` reduce; an `enter` block short-circuits
 *      to an `isError` result without ever invoking the real tool.
 *
 * Scope (v1): only the per-tool interceptor boundary is wired. The richer
 * lifecycle-event fan-out (`session:start`, `turn:end`, …) needs a conductor
 * seam that does not exist yet and is deferred. The tool interceptor boundary is
 * the load-bearing one — it is where the Wave 4 permission gate later registers
 * as a built-in interceptor rather than a parallel mechanism.
 */
import {
  type AddonSurfaceBundle,
  type AgentTool,
  type InterceptorChain,
  createAddonHost,
} from "../../addons/index.js";
import type { BootContext } from "../contract.js";

/**
 * Build and populate the addon host for a run, returning its wired
 * {@link AddonSurfaceBundle}.
 *
 * Constructs a host with an empty {@link FrameworkHandles} bag (v1 supplies no
 * `exec` handle — the runner has no shell-exec callback to hand an addon — and
 * the rest are interactive-only), installs a swallow-everything fault sink so a
 * broken addon degrades silently instead of crashing the boot, then discovers
 * and loads every addon under `<cwd>/.indus/addons` (the contract's default
 * {@link ADDONS_DIR}). With no addons directory the bundle is empty and wiring it
 * downstream is a no-op.
 *
 * @param ctx the boot context whose invocation carries the run cwd
 * @returns the wired bundle (dispatch, interceptors, contributed commands/tools)
 */
export async function buildAddonHost(ctx: BootContext): Promise<AddonSurfaceBundle> {
  const host = createAddonHost({ handles: {} });
  host.onFault(() => {
    // swallow addon load faults so a broken addon cannot sink the session
  });
  return host.loadAll({ workspace: ctx.invocation.cwd ?? process.cwd() });
}

/**
 * Fold a bundle's {@link InterceptorChain} around every tool a stage matches.
 *
 * Each tool whose `name` the chain matches is replaced with a wrapper that runs
 * the chain around its real `execute`; every other tool is returned *identical*
 * (same object reference) so an empty bundle leaves the deck untouched. The
 * contributed `bundle.tools` are NOT appended here — the caller concatenates
 * them (de-duped against the existing deck) before wrapping, so addon tools are
 * themselves subject to interception.
 *
 * @param tools  the run's tool deck (deck + MCP + already-concatenated addon tools)
 * @param bundle the loaded addon bundle whose interceptor chain wraps the deck
 * @returns a new array: matched tools wrapped, unmatched tools identity-equal
 */
export function wrapToolsWithAddons(tools: AgentTool[], bundle: AddonSurfaceBundle): AgentTool[] {
  const chain = bundle.interceptors;
  return tools.map(
    (tool) => chain.matches(tool.name) ? wrapOne(tool, chain) : tool,
  );
}

/**
 * Wrap one tool so its `execute` runs through the interceptor chain.
 *
 * The wrapper spreads the original tool (preserving `name` / `description` /
 * `parameters` / `label` and any extra fields) and overrides only `execute`. The
 * override:
 *
 *   - closes over the live `toolCallId`, `signal`, and `onUpdate` so streaming
 *     updates and cancellation still reach the real tool (the chain only threads
 *     the decoded `args`, so these must be captured here);
 *   - hands the chain a `(args) => realExecute(args)` closure as the inner
 *     execution and runs `chain.run({ tool, callId, args }, …)`;
 *   - maps the resulting {@link InterceptResult} back to an
 *     {@link AgentToolResult}: a `blocked` enter short-circuits to an `isError`
 *     result carrying the gate's `reason` (the real tool never ran); otherwise
 *     the chain's (possibly exit-rewritten) `result` is returned.
 *
 * The chain — not this wrapper — owns fault isolation and the throw-on-no-recover
 * semantics, so a tool error that no exit stage recovers propagates exactly as it
 * would unwrapped.
 *
 * @param tool  the real tool to fold the chain around
 * @param chain the interceptor chain matching this tool's name
 */
export function wrapOne(tool: AgentTool, chain: InterceptorChain): AgentTool {
  const realExecute = tool.execute.bind(tool);
  return {
    ...tool,
    async execute(toolCallId: string, params: unknown, signal?: AbortSignal, onUpdate?: unknown) {
      const args = params ?? {};
      const outcome = await chain.run(
        { tool: tool.name, callId: toolCallId, args: args as Record<string, unknown> },
        (next) => realExecute(toolCallId, next, signal as never, onUpdate as never),
      );
      if (outcome.blocked !== undefined) {
        return {
          content: [
            {
              type: "text",
              text: outcome.blocked.reason ?? "Blocked by an addon.",
            },
          ],
          details: undefined,
          isError: true,
        };
      }
      return outcome.result ?? { content: [], details: undefined };
    },
  };
}

/**
 * Concatenate an addon bundle's contributed tools onto an existing deck, dropping
 * any whose name a deck tool already claims.
 *
 * The host de-dupes its OWN tools against each other, but not against the product
 * deck or MCP tools — so an addon tool named `read` would otherwise shadow (or
 * be appended alongside) the core read tool. This filter keeps the first
 * claimant (the existing deck) and admits only addon tools with a fresh name.
 *
 * @param deck   the existing tool deck (deck + MCP)
 * @param bundle the loaded addon bundle whose `tools` are appended
 * @returns the deck followed by the non-conflicting addon tools
 */
export function concatAddonTools(deck: AgentTool[], bundle: AddonSurfaceBundle): AgentTool[] {
  if (bundle.tools.length === 0) return deck;
  const claimed = new Set(deck.map((t) => t.name));
  const fresh = bundle.tools.filter((t) => !claimed.has(t.name));
  return fresh.length === 0 ? deck : [...deck, ...fresh];
}
