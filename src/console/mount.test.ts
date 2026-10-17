import { expect, it, vi } from 'vitest';
const { render } = vi.hoisted(() => ({ render: vi.fn((_element: unknown, _options?: unknown) => ({unmount: vi.fn(), waitUntilExit: async () => {}})) }));
vi.mock('indusagi/react-host/ink', () => ({render}));
vi.mock('./components/TerminalConsole.js', () => ({ TerminalConsole: () => null }));
import { mountConsole, synchronizedOutputStream } from './mount.js';
it('keeps interrupt ownership in the application instead of exiting Ink on Ctrl+C', async () => {
  await mountConsole({} as any);
  expect(render.mock.calls[0]?.[1]).toMatchObject({exitOnCtrlC:false});
});

it('frames terminal writes with synchronized-output markers', () => {
  const writes: Array<string | Buffer> = [];
  const target = {
    write(chunk: string | Buffer) { writes.push(chunk); return true; }
  } as unknown as NodeJS.WriteStream;
  const output = synchronizedOutputStream(target, true);

  expect(output.write('frame')).toBe(true);
  expect(String(writes[0])).toBe('\x1b[?2026hframe\x1b[?2026l');
});
