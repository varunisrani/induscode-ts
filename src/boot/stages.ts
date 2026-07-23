// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Boot stage pipeline — the ordered list of {@link Stage} transforms that turn a
 * bare {@link BootContext} (argv + workspace + brand) into a fully-resolved one
 * (parsed invocation, materialised directories, applied upgrades, resolved
 * startup resources, selected runner).
 *
 * The pipeline is data, not control flow: {@link STAGES} lists each step in order,
 * and {@link runStages} folds an *immutable* context through them — every stage
 * receives a context and returns its successor (built by spreading, never by
 * mutating). A stage may be async; the fold awaits each in turn so ordering and
 * side-effect sequencing are deterministic.
 *
 * Stage order and intent:
 *   1. `locate-workspace`  — materialise the resolved {@link Workspace} on disk
 *      (`createWorkspace` + `ensureDirs`). Pure path computation already happened
 *      when the initial context was built; this stage only `mkdir`s.
 *   2. `apply-upgrades`    — fold the idempotent {@link applyUpgrades} registry
 *      over the workspace (a no-op on an already-current profile).
 *   3. `build-invocation`  — parse `argv` into the typed {@link Invocation}.
 *   4. `resolve-resources` — best-effort construct the framework
 *      settings/auth/model graph; degrade to a minimal object if the framework
 *      pieces are unavailable.
 *   5. `select-runner`     — no-op transform that exists for symmetry and tracing
 *      (the actual dispatch happens in {@link "./boot"} after the pipeline, so the
 *      selected runner can own the exit code). Kept in the list so the ordered
 *      pipeline reads as the full launch sequence.
 */
import type { BootContext, Stage } from "./contract";
/**
 * Materialise the resolved workspace directories on disk.
 *
 * The {@link BootContext.workspace} was already computed (pure) when the initial
 * context was assembled; this stage only ensures the directory subset exists so
 * later stages and runners can write into it. Returns the same context (the
 * workspace record is unchanged — only the filesystem side-effects happen here).
 */
declare const locateWorkspace: Stage;
/**
 * Run any pending one-time profile upgrades, idempotently.
 *
 * Folds the upgrade registry over the workspace. The driver is non-fatal: a step
 * that fails is reported and retried on a later launch, never aborting boot. The
 * context is returned unchanged (upgrades touch the filesystem, not the context).
 */
declare const upgrade: Stage;
/**
 * Parse `argv` into the typed {@link Invocation} and thread it onto the context.
 *
 * The initial context carries a placeholder invocation (the bootstrapper cannot
 * know the mode before parsing); this stage replaces it with the real parse.
 */
declare const buildInvocation: Stage;
/**
 * Best-effort assembly of the startup resource graph.
 *
 * Where the rebuilt framework owns a concept, the field is constructed from it:
 * {@link StartupResources.settings} from the framework's `DEFAULT_SETTINGS`, and
 * {@link StartupResources.models} from the framework's `ModelRegistry`. The
 * credential graph has no framework type yet, so it is an empty placeholder until
 * Phase 2. If a framework piece cannot be loaded, the stage degrades to a minimal
 * resources object built from empty literals rather than failing the boot — the
 * shape is what later phases depend on, and they fill it in.
 */
declare const resolveResources: Stage;
/**
 * Marker / tracing stage for runner selection.
 *
 * The real dispatch is performed by {@link "./boot"} after the pipeline so the
 * chosen runner can own the process exit code; this stage exists to keep the
 * ordered pipeline a faithful description of the launch sequence and to give the
 * selection step a name for tracing. It returns the context unchanged.
 */
declare const selectRunnerStage: Stage;
/**
 * The launch pipeline, in execution order. Folded by {@link runStages}.
 */
export declare const STAGES: readonly Stage[];
/**
 * Fold an ordered list of {@link Stage} transforms over an immutable
 * {@link BootContext}.
 *
 * Each stage receives the current context and returns its successor; the result
 * of one stage is the input to the next. Awaits every stage so async ordering is
 * deterministic. The input `initial` is never mutated — stages produce new
 * contexts by spreading.
 *
 * @param initial The seed context (argv + workspace + brand + placeholder fields).
 * @param stages  The ordered transforms to apply; defaults to {@link STAGES}.
 * @returns The fully-resolved context after every stage has run.
 */
export declare function runStages(initial: BootContext, stages?: readonly Stage[]): Promise<BootContext>;
export { locateWorkspace, upgrade, buildInvocation, resolveResources, selectRunnerStage, };
