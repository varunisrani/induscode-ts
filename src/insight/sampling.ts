// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Sampling — the admission gate that decides which trails are recorded.
 *
 * A {@link SampleGate} (declared in the contract) returns a per-trail verdict:
 * `true` keeps the trail (live handles), `false` collapses the whole trail to
 * {@link NOOP_HANDLE}. This module supplies the three concrete gates the recorder
 * draws from:
 *
 *   - {@link alwaysGate} — admit every trail (the default when sampling is off);
 *   - {@link neverGate}  — reject every trail (a disabled recorder);
 *   - {@link ratioGate}  — admit a deterministic fraction, keyed on the trail id.
 *
 * The ratio gate is the interesting one. It must be *sticky per trail* — a probe
 * may never disagree with its trail about being sampled — so the verdict is a
 * pure function of the trail id, not a coin flip. We fold the id into a 32-bit
 * value with an FNV-1a hash, project it onto the unit interval, and compare
 * against the configured fraction. The same id always yields the same verdict on
 * any machine, which also makes head-based sampling agree across a distributed
 * trail without coordination.
 */
import { FixedGates, SampleGate, TrailId } from "./contract";
/** A gate that admits every trail. Shared, frozen, allocation-free. */
export declare const alwaysGate: SampleGate;
/** A gate that rejects every trail. Shared, frozen, allocation-free. */
export declare const neverGate: SampleGate;
/** The two well-known fixed gates, bundled for the recorder fallback. */
export declare const FIXED_GATES: FixedGates;
/**
 * Fold a string into a 32-bit unsigned hash with FNV-1a.
 *
 * Chosen for being tiny, dependency-free, and well-distributed over short hex
 * ids. The result is forced unsigned with `>>> 0` so the projection onto the
 * unit interval never sees a negative numerator.
 *
 * @param text the string to hash (a trail id, in practice)
 * @returns a 32-bit unsigned integer
 */
export declare function hash32(text: string): number;
/**
 * Project a trail id onto the unit interval `[0, 1)`.
 *
 * The same id always lands on the same point, which is what makes a
 * {@link ratioGate} verdict deterministic and sticky.
 *
 * @param trailId the trail id to score
 * @returns a fraction in `[0, 1)`
 */
export declare function trailScore(trailId: TrailId): number;
/**
 * A sampling gate that admits a deterministic fraction of trails.
 *
 * Unlike {@link alwaysGate} / {@link neverGate}, this gate needs the *trail id*
 * to render a sticky verdict, but {@link SampleGate.admit} is handed only the
 * root name. The recorder therefore mints the trail id first and consults
 * {@link verdict} directly; {@link RatioGate.admit} is kept as a name-only
 * fallback (it folds the name instead) so the type still satisfies
 * {@link SampleGate}.
 */
export interface RatioGate extends SampleGate {
    /** The admitted fraction, clamped to `[0, 1]`. */
    readonly fraction: number;
    /** The sticky, id-keyed verdict the recorder actually consults. */
    verdict(trailId: TrailId): boolean;
}
/**
 * Build a {@link RatioGate} admitting roughly `fraction` of all trails.
 *
 * The verdict is `trailScore(id) < fraction`, so a fraction of `0.1` admits the
 * trails whose hashed id lands in the lowest tenth of the unit interval — about
 * a tenth of trails, deterministically. Edge fractions short-circuit to the
 * fixed gates: `<= 0` is {@link neverGate} behaviour and `>= 1` is
 * {@link alwaysGate} behaviour, with no hashing.
 *
 * @param fraction the admitted share, clamped to `[0, 1]`
 * @returns a frozen {@link RatioGate}
 */
export declare function ratioGate(fraction: number): RatioGate;
/**
 * Narrow a {@link SampleGate} to a {@link RatioGate}.
 *
 * Lets the recorder prefer the id-keyed {@link RatioGate.verdict} when the gate
 * exposes it, falling back to the name-only {@link SampleGate.admit} otherwise.
 */
export declare function isRatioGate(gate: SampleGate): gate is RatioGate;
