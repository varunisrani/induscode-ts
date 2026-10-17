/**
 * Welcome-card content & per-session variation.
 */

export interface MascotFace {
  readonly key: string;
  readonly eyes: readonly [string, string];
  readonly mouth: string;
}

export const MASCOTS: readonly MascotFace[] = [
  { key: "focus", eyes: ["●", "●"], mouth: "───" },
  { key: "happy", eyes: ["^", "^"], mouth: "◡◡◡" },
  { key: "chill", eyes: ["•", "•"], mouth: " ◡ " },
  { key: "spark", eyes: ["✦", "✦"], mouth: "oOo" },
  { key: "wink", eyes: ["•", "-"], mouth: "◡◡◡" },
  { key: "robo", eyes: ["◢", "◣"], mouth: "═══" }
];

export type MascotTone = "head" | "eye" | "mouth" | "feet";

export interface MascotSegment {
  readonly text: string;
  readonly tone: MascotTone;
}

export function mascotRows(face: MascotFace): readonly (readonly MascotSegment[])[] {
  const head = (text: string): MascotSegment => ({ text, tone: "head" });
  return [
    [head("╭───────╮")],
    [head("│ "), { text: face.eyes[0], tone: "eye" }, head("   "), { text: face.eyes[1], tone: "eye" }, head(" │")],
    [head("│  "), { text: face.mouth, tone: "mouth" }, head("  │")],
    [head("╰─┬───┬─╯")],
    [{ text: "  ╹   ╹", tone: "feet" }]
  ];
}

export const TIPS: readonly string[] = [
  "Run /help to explore commands and configured skill helpers",
  'Ask in plain English — try "fix the failing tests" or "explain src/agent.ts"',
  "Shift+Tab cycles: default → accept-edits → plan → bypass",
  "Type @ to attach a file, or paste an image straight into the prompt",
  "Run /status to check your model, account, and connectivity",
  "Use /help to discover specialized commands for the task at hand"
];

export const WHATS_NEW: readonly string[] = [
  "Ctrl+X runs your newest queued message NOW — the current run stops cleanly",
  "/compact shows live progress, resets to a fresh screen, and lists carried files",
  '"Allow always" is remembered for the session; sub-agents respect your permission mode'
];

function wrapIndex(seed: number, len: number): number {
  if (len <= 0) return 0;
  const n = Math.trunc(seed);
  return ((n % len) + len) % len;
}

export interface WelcomeVariant {
  readonly mascot: MascotFace;
  readonly tip: string;
}

export function pickWelcomeVariant(seed: number): WelcomeVariant {
  const mascot = MASCOTS[wrapIndex(seed, MASCOTS.length)];
  const tip = TIPS[wrapIndex(Math.trunc(seed / MASCOTS.length), TIPS.length)];
  return { mascot, tip };
}

export const PINNED_WELCOME_SEED = 12;

export function randomWelcomeSeed(): number {
  return Math.floor(Math.random() * 1e9);
}