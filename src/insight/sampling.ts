/**
 * Sampling — the admission gate that decides which trails are recorded.
 */
import type { FixedGates, SampleGate, TrailId } from "./contract.js";

export const alwaysGate: SampleGate = Object.freeze({
  admit(): boolean {
    return true;
  },
});

export const neverGate: SampleGate = Object.freeze({
  admit(): boolean {
    return false;
  },
});

export const FIXED_GATES: FixedGates = Object.freeze({
  always: alwaysGate,
  never: neverGate,
});

const FNV_OFFSET_BASIS = 2166136261;
const UINT32_SPAN = 4294967296;

export function hash32(text: string): number {
  let h = FNV_OFFSET_BASIS;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

export function trailScore(trailId: TrailId): number {
  return hash32(trailId) / UINT32_SPAN;
}

function clampFraction(fraction: number): number {
  if (Number.isNaN(fraction)) return 0;
  if (fraction <= 0) return 0;
  if (fraction >= 1) return 1;
  return fraction;
}

export interface RatioGate extends SampleGate {
  readonly fraction: number;
  verdict(trailId: TrailId): boolean;
}

export function ratioGate(fraction: number): RatioGate {
  const clamped = clampFraction(fraction);
  return Object.freeze({
    fraction: clamped,
    verdict(trailId: TrailId): boolean {
      if (clamped <= 0) return false;
      if (clamped >= 1) return true;
      return trailScore(trailId) < clamped;
    },
    admit(rootName: string): boolean {
      if (clamped <= 0) return false;
      if (clamped >= 1) return true;
      return hash32(rootName) / UINT32_SPAN < clamped;
    },
  });
}

export function isRatioGate(gate: SampleGate): gate is RatioGate {
  return typeof (gate as Partial<RatioGate>).verdict === "function";
}