// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Boot helper: assemble a {@link SessionConductor} for a non-interactive runner.
 *
 * Both the oneshot and the link runners drive a live conductor; this module owns
 * the one place that turns a {@link BootContext} into one, so the two runners do
 * not each re-derive the model id and session options. The model is taken from
 * the invocation when supplied, else resolved to the catalog default through the
 * {@link ModelMatcher}; the conductor itself is built lazily so no framework agent
 * is constructed until the first turn runs.
 */
import { type AgentTool, type ApprovalResolver, type CanUseToolFn, type PermissionMode, type PermissionRule, type SessionConductor } from "../../conductor";
import { type MemoryStore } from "../../capability-deck";
import { type DelegateRunner } from "../../capability-deck/cards/task-card";
import type { WorkflowAgentRunner } from "../../workflow-engine";
import { type CheckpointStore } from "./checkpoint";
import { type ContextDoc, type SkillCard } from "../../briefing";
import type { BootContext, Invocation } from "../contract";
/**
 * Resolve the model id for this run.
 *
 * Precedence: an explicit `--model` selector wins; otherwise a current model of a
 * provider the user has authenticated for (so a fresh launch lands on a model the
 * stored key can actually call); otherwise the catalog default.
 *
 * @param ctx the boot context carrying the parsed invocation
 * @returns the canonical model id to bind the session to
 */
export declare function resolveModelId(ctx: BootContext): string;
/**
 * Gather the on-disk skill cards the model may invoke this run: walk the project
 * and user `.indusagi/skills` roots and drop any card flagged
 * `disable-model-invocation` (those stay loadable explicitly, but the model is
 * not told about them). A filesystem walk error degrades to an empty list so a
 * bad/unreadable skills dir never sinks the session.
 */
export declare function gatherModelSkills(cwd: string): SkillCard[];
export declare function selectTools(cwd: string, inv: Invocation, runner?: DelegateRunner, memoryStore?: MemoryStore, checkpoint?: CheckpointStore, workflowRunner?: WorkflowAgentRunner): AgentTool[];
/**
 * Compose the run's system prompt: `--system` replaces the built-in briefing,
 * `--append-system` adds a trailing block, and both compose (override then
 * append). With neither, it is the tool-aware built-in briefing.
 */
export declare function composeSystem(tools: AgentTool[], inv: Invocation, cwd: string, skills?: readonly SkillCard[], memoryDoc?: ContextDoc): string;
/**
 * The cwd-scoped session directory under the workspace `sessions/` root.
 *
 * Sessions are partitioned per working directory (so `--continue` means "the most
 * recent session in THIS directory"). The cwd is slugged — every non-alphanumeric
 * run collapsed to a single dash — and wrapped in `--…--` markers, matching the
 * on-disk layout. Both the conductor (writer) and {@link SessionLibrary} (reader)
 * must agree on this, so it lives here and is shared by the repl runner.
 *
 * @param sessionsRoot the workspace `sessions/` directory
 * @param cwd          the run's working directory
 */
export declare function sessionScopeDir(sessionsRoot: string, cwd: string): string;
/**
 * Build the `canUseTool` gate factory for a boot run.
 *
 * The factory receives a getter onto the conductor's LIVE permission mode plus the
 * conductor's stable approval delegate, and returns the gate that reads them. The
 * delegate is threaded straight into `requestApproval`: on a NON-interactive boot
 * (oneshot / link) no resolver is ever installed, so the delegate denies and an
 * `ask` decision deterministically denies with an actionable message. The
 * interactive (React) console installs its overlay resolver via the conductor's
 * `setApprovalResolver` AFTER mount, at which point the SAME delegate begins
 * routing `ask` decisions to the overlay — no rebuild, fully additive.
 *
 * `rules` is the session's LIVE mutable rule list: the gate re-scans it on every
 * call, and an `allow-always` approval appends into it (via `appendAllowRule`
 * below), so the approval is remembered for the remainder of the session — and
 * ONLY the session; nothing is ever written back to settings. Every gate the
 * factory mints (and every sub-agent gate built over the same array) sees the
 * appended rules immediately.
 *
 * Exported for the boot tests; product callers go through
 * {@link buildSessionConductor}.
 */
export declare function buildPermissionGate(rules: PermissionRule[], mode: PermissionMode, tools: readonly AgentTool[], planReachable?: boolean): ((currentMode: () => PermissionMode, requestApproval?: ApprovalResolver) => CanUseToolFn) | undefined;
export declare function buildSessionConductor(ctx: BootContext): Promise<SessionConductor>;
/**
 * The prompts a oneshot run submits: the positional first prompt when present,
 * plus any pass-through tokens that survived flag parsing. Empty when the
 * invocation carried no request text (the caller decides what to do then).
 *
 * @param ctx the boot context carrying the parsed invocation
 */
export declare function oneshotPrompts(ctx: BootContext): string[];
