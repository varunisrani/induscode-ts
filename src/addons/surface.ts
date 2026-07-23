// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * AddonSurface implementation — the recording registration API.
 *
 * This module realizes the contract's central design stance: an addon's
 * `register` entry point is handed a {@link AddonSurface} and *records* its
 * intent — event subscriptions, tool interceptors, slash commands, contributed
 * tools — rather than mutating any shared runtime. Each surface is a small,
 * per-addon accumulator: every `on` / `interceptTool` / `addCommand` / `addTool`
 * call appends to a private list, and {@link RecordingSurface.manifest} reads the
 * accumulated {@link RegisteredManifest} back out for the host to fold.
 *
 * Because registration is pure recording, the host stays in control of *what to
 * do* with the contributions. The surface only:
 *
 *   - stamps every recorded shape with the owning {@link AddonId} (so a later
 *     fault is attributable) and fills the `match` / `name` fields the surface
 *     methods take separately from the handler object;
 *   - threads the host-supplied {@link FrameworkHandles} through unchanged, so an
 *     addon can act at registration time and the same handles reach its command
 *     contexts; and
 *   - returns an immutable snapshot from {@link RecordingSurface.manifest}, so a
 *     read after `register` settles cannot be mutated by a stray later call.
 *
 * The surface performs no dispatch, no loading, and no conflict resolution —
 * those are the host's job once it has folded every addon's manifest. Keeping the
 * surface this thin is what makes registration a description of capability rather
 * than a side effect on the agent.
 */
import type { AddonId, AddonSurface, FrameworkHandles } from "./contract";
/**
 * Mint a fresh {@link AddonSurface} for one addon.
 *
 * The host calls this once per addon, scoping the surface to that addon's
 * {@link AddonId} and the session's {@link FrameworkHandles}, then passes the
 * surface to the addon's `register`. After `register` settles the host reads
 * {@link AddonSurface.manifest} to obtain the contributions to fold.
 *
 * @param id      the addon the surface is scoped to
 * @param handles the framework handles the addon (and its commands) may act through
 * @param version optional addon version carried into the recorded manifest
 */
export declare function createSurface(id: AddonId, handles: FrameworkHandles, version?: string): AddonSurface;
