import { describe, expect, it } from 'vitest';
import { compareVersions, runDoctor } from '../../src/commands/doctor.js';
import { PreconditionError } from '../../src/core/errors.js';
import { failResult, fakeRunner, makeContext, okResult, tempDir } from '../helpers.js';

describe('compareVersions', () => {
  it.each([
    ['22.12.0', '22.12.0', 0],
    ['24.0.0', '22.12.0', 1],
    ['22.11.9', '22.12.0', -1],
    ['v22.12.1', '22.12.0', 1],
    ['26.0.0-pre', '26.0.0', 0],
  ])('%s vs %s', (a, b, sign) => {
    expect(Math.sign(compareVersions(a, b))).toBe(sign);
  });
});

describe('runDoctor', () => {
  it('passes when node is new enough and one package manager exists', async () => {
    const runner = fakeRunner((c) => (c.file === 'npm' ? failResult() : okResult('1.0.0')));
    const ctx = makeContext({ cwd: await tempDir(), runner });
    await runDoctor(ctx, '22.12.0');
    expect(ctx.output.results[0]).toMatchObject({ ok: true });
  });

  it('fails when node is too old', async () => {
    const ctx = makeContext({ cwd: await tempDir() });
    await expect(runDoctor(ctx, '20.19.0')).rejects.toThrow(PreconditionError);
    expect(ctx.output.results[0]).toMatchObject({ ok: false });
  });

  it('fails when neither npm nor pnpm is available', async () => {
    const runner = fakeRunner((c) => (c.file === 'git' ? okResult('git 2') : failResult()));
    const ctx = makeContext({ cwd: await tempDir(), runner });
    await expect(runDoctor(ctx, '24.0.0')).rejects.toThrow(PreconditionError);
  });
});
