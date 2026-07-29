/**
 * Shell kit — POSIX shell-argument quoting and command assembly.
 */

const SHELL_SAFE = /^[A-Za-z0-9_@%+=:,./-]+$/;

export function quoteArg(arg: string): string {
  if (arg.length === 0) return "''";
  if (SHELL_SAFE.test(arg)) return arg;
  return `'${arg.split("'").join("'\\''")}'`;
}

export function needsQuoting(arg: string): boolean {
  return arg.length === 0 || !SHELL_SAFE.test(arg);
}

export function buildShellCommand(args: readonly string[]): string {
  return args.map(quoteArg).join(" ");
}