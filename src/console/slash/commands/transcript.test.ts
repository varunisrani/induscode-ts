import { describe, expect, it, vi } from 'vitest';
import { transcriptCommands } from './transcript.js';

describe('compaction guidance', () => {
  it('passes shell-looking guidance literally to compaction without executing a shell', async () => {
    const instructions = 'keep $(printf SENTINEL) and `date` literally';
    const conductor = { executeBash: vi.fn(), condense: vi.fn(async () => 'nothing') };
    const ctx = { args: instructions, conductor, setStatus: vi.fn() };
    await transcriptCommands.find(c => c.name === 'compact')!.run(ctx as any);
    await Promise.resolve();
    expect(conductor.executeBash).not.toHaveBeenCalled();
    expect(conductor.condense).toHaveBeenCalledWith(instructions);
  });
});
