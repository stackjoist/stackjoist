import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CancelledError, ExternalToolError } from '../../src/core/errors.js';
import { describePlan, executePlan, type Plan } from '../../src/core/plan.js';
import { failResult, fakeRunner, tempDir } from '../helpers.js';

const plan: Plan = {
  ops: [
    { kind: 'write', path: 'package.json', content: '{}' },
    { kind: 'run', label: 'Generate', file: 'gen', args: ['--flag', 'value with spaces'] },
    { kind: 'write', path: 'src/index.ts', content: 'export {};' },
  ],
};

describe('describePlan', () => {
  it('lists every operation in order', () => {
    expect(describePlan(plan)).toEqual([
      'create  package.json',
      'run     gen --flag value with spaces',
      'create  src/index.ts',
    ]);
  });
});

describe('executePlan', () => {
  it('writes files and runs commands in order inside the root', async () => {
    const root = await tempDir();
    const runner = fakeRunner();
    await executePlan(plan, { root, runner });
    expect(await readFile(path.join(root, 'src', 'index.ts'), 'utf8')).toBe('export {};');
    expect(runner.calls).toHaveLength(1);
    expect(runner.calls[0]?.args).toEqual(['--flag', 'value with spaces']);
    expect(runner.calls[0]?.options.cwd).toBe(root);
  });

  it('turns a failed command into an ExternalToolError', async () => {
    const root = await tempDir();
    await expect(
      executePlan(plan, { root, runner: fakeRunner(() => failResult('generator crashed')) }),
    ).rejects.toThrow(ExternalToolError);
  });

  it('stops before the next operation once aborted', async () => {
    const root = await tempDir();
    const controller = new AbortController();
    controller.abort();
    await expect(
      executePlan(plan, { root, runner: fakeRunner(), signal: controller.signal }),
    ).rejects.toThrow(CancelledError);
  });

  it('rejects a command cwd outside the root', async () => {
    const root = await tempDir();
    const bad: Plan = { ops: [{ kind: 'run', label: 'x', file: 'x', args: [], cwd: '../' }] };
    await expect(executePlan(bad, { root, runner: fakeRunner() })).rejects.toThrow(/outside/);
  });
});
