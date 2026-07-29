// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * The bridge network — mounting external MCP servers into the ledger.
 *
 * This is the side-effecting half of bridge enrollment. The framework's
 * {@link mountProtocolBridge} does the protocol work: it connects every
 * configured server, lists each ready endpoint's tools, and hands back a single
 * {@link ToolBox} whose `descriptors()` advertise every grafted remote tool
 * under its qualified `"<server>__<tool>"` name and whose `runner` routes a call
 * back across the owning endpoint.
 *
 * What this module adds on top:
 *
 *   - **Adaptation.** A {@link ToolBox} speaks the runtime's descriptor/runner
 *     contract; the conductor and catalog speak {@link Capability} (the
 *     framework `AgentTool`). {@link bridgeBoxToCapabilities} bridges the two,
 *     wrapping each descriptor + the shared runner into an `AgentTool` whose
 *     `execute` invokes the runner and projects its opaque outcome onto an
 *     {@link AgentToolResult}.
 *   - **Enrollment.** {@link attachBridgeCapabilities} folds those adapted
 *     capabilities into a {@link BridgeLedger} as `enroll` events, returning the
 *     new ledger, the live fleet (for teardown), and the typed status — never
 *     mutating a shared array.
 *   - **Cataloging.** {@link bridgeCapabilityCard} re-presents a grafted
 *     capability as a {@link CapabilityCard}, so dynamic MCP tools surface in
 *     help/introspection beside the static catalog rows.
 *
 * Failure isolation comes for free from the fleet: a server that faulted on
 * connect contributes no descriptors and is simply absent from the enrollment.
 */
import { type AnyCapability, type CapabilityCard, type DeckFault } from "../contract.js";
import { type BridgeConfig, type ServerConfig, type ServerFleet, type FleetStatus } from "indusagi/interop";
import type { ToolBox } from "indusagi/runtime";
import { type BridgeLedger } from "./ledger.js";
/**
 * Adapt every tool a mounted {@link ToolBox} advertises into a list of
 * {@link Capability} objects the conductor and ledger consume.
 *
 * Each box descriptor becomes one `AgentTool`: its qualified name, description,
 * and parameter schema are carried verbatim, and its `execute` defers to the
 * box's shared `runner` — passing the abort signal through and projecting the
 * outcome with {@link projectOutcome}. The runner already knows how to route a
 * call by name back to the owning endpoint, so the wrapper stays a thin shim.
 *
 * @param box the tool box returned by {@link mountProtocolBridge}
 */
export declare function bridgeBoxToCapabilities(box: ToolBox): AnyCapability[];
/**
 * Re-present a grafted bridge capability as a {@link CapabilityCard}.
 *
 * Lets dynamic MCP tools appear in the same catalog/help surface as the static
 * cards: the card's `build` simply returns the already-live capability (the
 * graft happened at mount time, so there is nothing further to construct). The
 * owning server id is recovered from the qualified name for the title.
 *
 * @param capability a capability produced by {@link bridgeBoxToCapabilities}
 */
export declare function bridgeCapabilityCard(capability: AnyCapability): CapabilityCard;
/**
 * The outcome of attaching one or more MCP servers to a ledger.
 *
 * Bundles the new {@link BridgeLedger} (with every reachable tool enrolled), the
 * live {@link ServerFleet} the caller owns and must eventually tear down, the
 * aggregate {@link FleetStatus} for rendering, the count of tools grafted, and a
 * non-fatal {@link DeckFault} when the mount itself failed wholesale.
 */
export interface AttachResult {
    /** The ledger after enrolling every grafted capability. */
    readonly ledger: BridgeLedger;
    /** The running fleet of endpoints; caller closes it via {@link detachBridge}. */
    readonly fleet?: ServerFleet;
    /** Aggregate per-server health, when a fleet came up. */
    readonly status?: FleetStatus;
    /** How many remote tools were enrolled. */
    readonly enrolled: number;
    /** A wholesale-mount fault, when connecting the bridge threw. */
    readonly fault?: DeckFault;
}
/**
 * Mount external MCP servers and enroll their tools into the bridge ledger.
 *
 * Connects every server in `config` through {@link mountProtocolBridge}, adapts
 * the resulting box into capabilities, and folds each one into `ledger` as an
 * `enroll` event — yielding a *new* ledger (the input is untouched). The live
 * fleet is returned so the caller can read status and later tear it down; a
 * faulted server simply contributes no tools and is reflected in the status.
 *
 * A wholesale failure (the mount call itself rejecting) is caught and reported
 * as a `bridge` {@link DeckFault} on the result rather than thrown, so a bad MCP
 * configuration degrades the deck instead of sinking session bootstrap.
 *
 * @param ledger the ledger to enroll into (left untouched)
 * @param config the set of MCP servers to connect and graft
 */
export declare function attachBridgeCapabilities(ledger: BridgeLedger, config: BridgeConfig): Promise<AttachResult>;
/**
 * Detach one or more servers: retire their ledger entries and close the fleet.
 *
 * Withdraws every named server's live capabilities from `ledger` (or, when no
 * names are given, every server present in the fleet status) and gracefully
 * tears the fleet down. Returns the new ledger; the fleet is no longer usable
 * after this resolves. The teardown is best-effort — a close that throws is
 * swallowed so ledger withdrawal still completes.
 *
 * @param ledger  the current ledger (left untouched)
 * @param fleet   the live fleet to close
 * @param servers optional subset of server ids to detach; defaults to all
 */
export declare function detachBridge(ledger: BridgeLedger, fleet: ServerFleet, servers?: readonly string[]): Promise<BridgeLedger>;
/**
 * Convenience: turn a flat list of MCP server descriptions into the
 * {@link BridgeConfig} {@link attachBridgeCapabilities} expects.
 *
 * @param servers the per-server transport configurations, in declaration order
 */
export declare function bridgeConfig(servers: readonly ServerConfig[]): BridgeConfig;
