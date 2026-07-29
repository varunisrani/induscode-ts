/**
 * Banner colour-sweep helpers.
 */

const WELCOME_FALLBACK = "Welcome back!";
const MAX_NAME = 40;

/**
 * Format the personalized welcome greeting.
 */
export function welcomeLine(name?: string): string {
  if (name === void 0) return WELCOME_FALLBACK;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME) return WELCOME_FALLBACK;
  return `Welcome back, ${trimmed}!`;
}

/**
 * The frozen sweep colour for one wordmark row.
 */
export function rowGradient(rowIndex: number, rowCount: number, primaryHex: string, secondaryHex: string): string {
  if (rowCount <= 1) return primaryHex;
  return primaryHex;
}