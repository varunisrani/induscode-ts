/**
 * Background-process capability — start, poll, and stop long-lived child
 * processes that outlive a single tool call.
 *
 * App-novel and framework-agnostic: it wraps Node's `child_process.spawn`
 * directly rather than delegating to any framework process controller, so the
 * lifecycle is owned entirely by this card. A long-running command (a dev
 * server, a watcher, a build in `--watch` mode) is launched detached from the
 * tool turn; the agent later polls its captured output or signals it to stop.
 *
 * One tool folds the lifecycle into an `action` discriminant:
 *   - `start` — spawn `command` in a shell, return the assigned handle id.
 *   - `poll`  — return the buffered stdout/stderr (and live/exited status) for a
 *               handle, optionally only the lines appended since the last poll.
 *   - `stop`  — send SIGTERM (escalating to SIGKILL after a grace window) to a
 *               handle's process tree.
 *   - `list`  — enumerate every handle this capability is tracking.
 *
 * Output is captured into bounded ring buffers so a chatty process cannot grow
 * memory without limit; only the most recent lines are retained. The card
 * produces a {@link Capability} (framework `AgentTool`) the conductor consumes.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { Type, type Static } from "@sinclair/typebox";
import { capabilityId, type Capability, type CapabilityCard, type DeckContext } from "../contract.js";

/** Coarse lifecycle state of a tracked background process. */
export type DaemonState = "running" | "exited" | "signalled";

/** A bounded buffer of recent output lines for one stream. */
interface RingBuffer {
    lines: string[];
    /** Index of the next unread line for incremental polling. */
    cursor: number;
}

/** One tracked background process and its captured state. */
interface DaemonHandle {
    readonly id: string;
    readonly command: string;
    readonly child: ChildProcess;
    state: DaemonState;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    readonly startedAt: number;
    readonly stdout: RingBuffer;
    readonly stderr: RingBuffer;
}

/** Cap on how many output lines one ring buffer keeps per stream. */
const MAX_BUFFERED_LINES = 2_000;

/**
 * An in-process table of background children, owned by one built capability.
 *
 * Each `start` spawns a shell-wrapped child, wires its stdout/stderr into
 * bounded buffers, and records terminal state on `exit`. `stop` escalates from
 * SIGTERM to SIGKILL if the process does not exit within a grace window. The
 * table is per-capability, so one session's daemons are isolated from another's.
 */
export class DaemonTable {
    private readonly handles = new Map<string, DaemonHandle>();
    private nextSeq = 1;
    private readonly cwd: string;

    constructor(cwd: string) {
        this.cwd = cwd;
    }

    start(command: string): DaemonHandle {
        const id = `bg-${this.nextSeq++}`;
        const child = spawn(command, {
            cwd: this.cwd,
            shell: true,
            stdio: ["ignore", "pipe", "pipe"],
            detached: false,
        });
        const handle: DaemonHandle = {
            id,
            command,
            child,
            state: "running",
            exitCode: null,
            signal: null,
            startedAt: Date.now(),
            stdout: { lines: [], cursor: 0 },
            stderr: { lines: [], cursor: 0 },
        };
        child.stdout?.setEncoding("utf8");
        child.stderr?.setEncoding("utf8");
        child.stdout?.on("data", (d) => pushLines(handle.stdout, d));
        child.stderr?.on("data", (d) => pushLines(handle.stderr, d));
        child.on("exit", (code, sig) => {
            handle.exitCode = code;
            handle.signal = sig;
            handle.state = sig ? "signalled" : "exited";
        });
        child.on("error", (err) => {
            pushLines(handle.stderr, `spawn error: ${String(err)}`);
            handle.state = "exited";
        });
        this.handles.set(id, handle);
        return handle;
    }

    get(id: string): DaemonHandle | undefined {
        return this.handles.get(id);
    }

    list(): DaemonHandle[] {
        return [...this.handles.values()];
    }

    /**
     * Signal a handle's process to terminate. Sends SIGTERM immediately and a
     * SIGKILL after `graceMs` if the child is still alive. Resolves once the
     * child has exited or the kill has been sent.
     */
    async stop(handle: DaemonHandle, graceMs = 3_000): Promise<void> {
        if (handle.state !== "running") return;
        const child = handle.child;
        child.kill("SIGTERM");
        await new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
                if (handle.state === "running") child.kill("SIGKILL");
                resolve();
            }, graceMs);
            child.once("exit", () => {
                clearTimeout(timer);
                resolve();
            });
        });
    }
}

/** Append chunked stream output to a ring buffer, trimming the oldest lines when full. */
function pushLines(buf: RingBuffer, chunk: string): void {
    for (const line of chunk.split(/\r?\n/)) {
        if (line.length === 0) continue;
        buf.lines.push(line);
    }
    if (buf.lines.length > MAX_BUFFERED_LINES) {
        const drop = buf.lines.length - MAX_BUFFERED_LINES;
        buf.lines.splice(0, drop);
        buf.cursor = Math.max(0, buf.cursor - drop);
    }
}

/** Drain the buffered output, optionally only since the last read. */
function drainBuffer(buf: RingBuffer, sinceLast: boolean): string[] {
    if (sinceLast) {
        const fresh = buf.lines.slice(buf.cursor);
        buf.cursor = buf.lines.length;
        return fresh;
    }
    return [...buf.lines];
}

/** Format a handle's status for model-facing prose. */
function statusLine(h: DaemonHandle): string {
    if (h.state === "running") return "running";
    if (h.state === "signalled") return `signalled (${h.signal ?? "?"})`;
    return `exited (code ${h.exitCode ?? "?"})`;
}

const DaemonParams = Type.Object(
    {
        action: Type.Union(
            [
                Type.Literal("start"),
                Type.Literal("poll"),
                Type.Literal("stop"),
                Type.Literal("list"),
            ],
            {
                description:
                    "`start` launches a long-running command; `poll` reads its captured output; `stop` terminates it; `list` shows all tracked processes.",
            },
        ),
        command: Type.Optional(
            Type.String({
                description: "Shell command to launch. Required for `start`.",
            }),
        ),
        id: Type.Optional(
            Type.String({
                description: "Handle returned by `start`. Required for `poll` and `stop`.",
            }),
        ),
        sinceLast: Type.Optional(
            Type.Boolean({
                description:
                    "On `poll`, return only output appended since the previous poll of this handle. Defaults to false (return the full retained buffer).",
            }),
        ),
    },
    { additionalProperties: false },
);

/** Statically-inferred parameter type the capability's `execute` receives. */
export type DaemonParamsType = Static<typeof DaemonParams>;

/** Structured detail returned alongside the model-facing content. */
export interface DaemonDetails {
    readonly action: "start" | "poll" | "stop" | "list";
    readonly ok: boolean;
    readonly id?: string;
    readonly state?: DaemonState;
    readonly exitCode?: number | null;
    readonly processes?: ReadonlyArray<{
        readonly id: string;
        readonly command: string;
        readonly state: DaemonState;
    }>;
}

const DAEMON_DESCRIPTION =
    'Run and manage long-lived background processes that persist across tool calls \u2014 dev servers, file watchers, anything you start once and observe over time. Use `action:"start"` with a `command` to launch one (you get back a handle `id`), `action:"poll"` with that `id` to read its accumulated output, `action:"stop"` to terminate it, and `action:"list"` to see what is running. Do NOT use this for ordinary one-shot commands that finish on their own \u2014 run those with the shell tool.';

/** Standard error result shape for invalid bg-process actions. */
function errResult(action: DaemonDetails["action"], message: string): {
    content: Array<{ type: "text"; text: string }>;
    details: DaemonDetails;
    isError: true;
} {
    return {
        content: [{ type: "text", text: message }],
        details: { action, ok: false },
        isError: true,
    };
}

/**
 * Build the background-process capability, binding it to a fresh per-session
 * {@link DaemonTable} scoped to the context's working directory.
 *
 * @param ctx the deck context — its `cwd` is where launched processes run.
 */
export function buildDaemonCapability(ctx: DeckContext): Capability<typeof DaemonParams, DaemonDetails> {
    const table = new DaemonTable(ctx.cwd);
    return {
        name: "bg-process",
        label: "Background process",
        description: DAEMON_DESCRIPTION,
        parameters: DaemonParams,
        async execute(_toolCallId, params) {
            switch (params.action) {
                case "start": {
                    if (!params.command) {
                        return errResult("start", "`command` is required to start a background process.");
                    }
                    const h = table.start(params.command);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Started background process ${h.id}: ${h.command}\nPoll it with action:"poll", id:"${h.id}".`,
                            },
                        ],
                        details: { action: "start", ok: true, id: h.id, state: h.state },
                    };
                }
                case "poll": {
                    const h = params.id ? table.get(params.id) : undefined;
                    if (!h) return errResult("poll", `No background process with id "${params.id ?? ""}".`);
                    const out = drainBuffer(h.stdout, params.sinceLast ?? false);
                    const err = drainBuffer(h.stderr, params.sinceLast ?? false);
                    const parts = [`Process ${h.id} \u2014 ${statusLine(h)}`];
                    if (out.length) parts.push(`--- stdout ---\n${out.join("\n")}`);
                    if (err.length) parts.push(`--- stderr ---\n${err.join("\n")}`);
                    if (out.length === 0 && err.length === 0) parts.push("(no new output)");
                    return {
                        content: [{ type: "text", text: parts.join("\n") }],
                        details: {
                            action: "poll",
                            ok: true,
                            id: h.id,
                            state: h.state,
                            exitCode: h.exitCode,
                        },
                    };
                }
                case "stop": {
                    const h = params.id ? table.get(params.id) : undefined;
                    if (!h) return errResult("stop", `No background process with id "${params.id ?? ""}".`);
                    await table.stop(h);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Stopped background process ${h.id} (${statusLine(h)}).`,
                            },
                        ],
                        details: {
                            action: "stop",
                            ok: true,
                            id: h.id,
                            state: h.state,
                            exitCode: h.exitCode,
                        },
                    };
                }
                case "list": {
                    const all = table.list();
                    const text =
                        all.length === 0
                            ? "No background processes are being tracked."
                            : all.map((h) => `${h.id} [${statusLine(h)}] ${h.command}`).join("\n");
                    return {
                        content: [{ type: "text", text }],
                        details: {
                            action: "list",
                            ok: true,
                            processes: all.map((h) => ({
                                id: h.id,
                                command: h.command,
                                state: h.state,
                            })),
                        },
                    };
                }
            }
        },
    };
}

/** Catalog row for the background-process capability. */
export const daemonCard: CapabilityCard = {
    id: capabilityId("bg-process"),
    title: "Background process",
    summary: "Start, poll, and stop long-lived child processes that span multiple turns.",
    // Erase the precisely-typed builder to the `Capability` card surface (through
    // `unknown`, as TypeBox tools are invariant in their parameter schema).
    build: (ctx) => buildDaemonCapability(ctx),
};