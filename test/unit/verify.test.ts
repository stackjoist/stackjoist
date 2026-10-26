import { describe, expect, it } from 'vitest';
import { runVerify } from '../../src/verify/run.js';
import { failResult, fakeRunner, okResult } from '../helpers.js';

const steps = [
  { name: 'typecheck', script: 'typecheck' },
  { name: 'test', script: 'test' },
  { name: 'build', script: 'build' },
];

describe('runVerify', () => {
  it('runs every step through the package manager', async () => {
    const runner = fakeRunner();
    const results = await runVerify(steps, { cwd: '/p', packageManager: 'pnpm', runner });
    expect(results.map((r) => [r.name, r.status, r.command])).toEqual([
      ['typecheck', 'PASS', 'pnpm run typecheck'],
      ['test', 'PASS', 'pnpm run test'],
      ['build', 'PASS', 'pnpm run build'],
    ]);
    expect(runner.calls.every((c) => c.options.cwd === '/p')).toBe(true);
  });

  it('reports steps after a failure as NOT RUN, with the failure output', async () => {
    const runner = fakeRunner((c) =>
      c.args[1] === 'test' ? failResult('2 tests failed') : okResult(),
    );
    const results = await runVerify(steps, { cwd: '/p', packageManager: 'npm', runner });
    expect(results.map((r) => r.status)).toEqual(['PASS', 'FAIL', 'NOT RUN']);
    expect(results[1]?.output).toContain('2 tests failed');
    expect(runner.calls).toHaveLength(2);
  });
});
