import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCreate, type CreateOptions } from '../../src/commands/create.js';
import {
  CancelledError,
  ExternalToolError,
  PreconditionError,
  UsageError,
} from '../../src/core/errors.js';
import type { Prompter } from '../../src/core/prompter.js';
import type { Recipe } from '../../src/recipes/types.js';
import {
  failResult,
  fakeRunner,
  makeContext,
  okResult,
  scriptedPrompter,
  tempDir,
} from '../helpers.js';

/** Test-only recipe: writes two files and runs one generator command. */
const fixtureRecipe: Recipe = {
  id: 'fixture',
  title: 'Fixture',
  description: 'test recipe',
  packageManagers: ['npm', 'pnpm'],
  plan: ({ projectName }) => ({
    ops: [
      { kind: 'write', path: 'package.json', content: JSON.stringify({ name: projectName }) },
      { kind: 'run', label: 'Run generator', file: 'fixture-gen', args: [projectName] },
      { kind: 'write', path: 'src/index.ts', content: 'export {};\n' },
    ],
  }),
  nextSteps: ({ packageManager }) => [`${packageManager} run dev`],
};

const defaults: CreateOptions = {
  name: 'my-app',
  template: 'fixture',
  pm: 'pnpm',
  install: true,
  git: true,
  dryRun: false,
};

describe('runCreate', () => {
  it('generates the project, then installs and runs git init in the target', async () => {
    const cwd = await tempDir();
    const runner = fakeRunner((c) =>
      c.args[0] === 'rev-parse' ? failResult('not a git repository') : okResult(),
    );
    const ctx = makeContext({ cwd, runner });
    await runCreate(defaults, ctx, [fixtureRecipe]);

    const target = path.join(cwd, 'my-app');
    expect(JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8'))).toEqual({
      name: 'my-app',
    });
    expect(await readdir(cwd)).toEqual(['my-app']); // no staging leftovers
    expect(runner.calls.map((c) => [c.file, ...c.args].join(' '))).toEqual([
      'fixture-gen my-app',
      'pnpm install',
      'git rev-parse --is-inside-work-tree',
      'git init',
    ]);
    expect(runner.calls[1]?.options.cwd).toBe(target);
    expect(ctx.output.results[0]).toMatchObject({
      ok: true,
      steps: [
        { step: 'generate', status: 'PASS' },
        { step: 'install', status: 'PASS' },
        { step: 'git init', status: 'PASS' },
      ],
      nextSteps: ['cd my-app', 'pnpm run dev'],
    });
  });

  it('dry run writes nothing and runs nothing', async () => {
    const cwd = await tempDir();
    const runner = fakeRunner();
    const ctx = makeContext({ cwd, runner });
    await runCreate({ ...defaults, dryRun: true }, ctx, [fixtureRecipe]);
    expect(await readdir(cwd)).toEqual([]);
    expect(runner.calls).toEqual([]);
    expect(ctx.output.results[0]).toMatchObject({
      dryRun: true,
      plan: [
        'create  package.json',
        'run     fixture-gen my-app',
        'create  src/index.ts',
        'run     pnpm install',
        'run     git init',
      ],
    });
  });

  it('reports skipped steps as NOT RUN', async () => {
    const ctx = makeContext({ cwd: await tempDir() });
    await runCreate({ ...defaults, install: false, git: false }, ctx, [fixtureRecipe]);
    expect(ctx.output.results[0]).toMatchObject({
      steps: [
        { status: 'PASS' },
        { step: 'install', status: 'NOT RUN' },
        { step: 'git init', status: 'NOT RUN' },
      ],
      nextSteps: ['cd my-app', 'pnpm install', 'pnpm run dev'],
    });
  });

  it('leaves no output behind when generation fails', async () => {
    const cwd = await tempDir();
    const runner = fakeRunner(() => failResult('generator crashed'));
    await expect(
      runCreate(defaults, makeContext({ cwd, runner }), [fixtureRecipe]),
    ).rejects.toThrow(ExternalToolError);
    expect(await readdir(cwd)).toEqual([]);
  });

  it('keeps generated files and explains recovery when install fails', async () => {
    const cwd = await tempDir();
    const runner = fakeRunner((c) =>
      c.file === 'pnpm' ? failResult('registry down') : okResult(),
    );
    const error = await runCreate(defaults, makeContext({ cwd, runner }), [fixtureRecipe]).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ExternalToolError);
    expect((error as ExternalToolError).hint).toMatch(/pnpm install/);
    expect(await readdir(path.join(cwd, 'my-app'))).toContain('package.json');
  });

  it('never touches a non-empty target directory', async () => {
    const cwd = await tempDir();
    await mkdir(path.join(cwd, 'my-app'));
    await writeFile(path.join(cwd, 'my-app', 'notes.txt'), 'mine');
    const runner = fakeRunner();
    await expect(
      runCreate(defaults, makeContext({ cwd, runner }), [fixtureRecipe]),
    ).rejects.toThrow(PreconditionError);
    expect(await readdir(path.join(cwd, 'my-app'))).toEqual(['notes.txt']);
    expect(runner.calls).toEqual([]);
  });

  it('rejects invalid names before touching the filesystem', async () => {
    const cwd = await tempDir();
    await expect(
      runCreate({ ...defaults, name: '../evil' }, makeContext({ cwd }), [fixtureRecipe]),
    ).rejects.toThrow(UsageError);
    expect(await readdir(cwd)).toEqual([]);
  });

  it('explains when no recipes are available', async () => {
    await expect(runCreate(defaults, makeContext({ cwd: await tempDir() }), [])).rejects.toThrow(
      PreconditionError,
    );
  });

  it('rejects an unknown template and lists the available ones', async () => {
    const error = await runCreate(
      { ...defaults, template: 'nope' },
      makeContext({ cwd: await tempDir() }),
      [fixtureRecipe],
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UsageError);
    expect((error as UsageError).hint).toContain('fixture');
  });

  it('requires name and template when it cannot prompt', async () => {
    const ctx = makeContext({ cwd: await tempDir() });
    const { name: _n, ...noName } = defaults;
    await expect(runCreate(noName, ctx, [fixtureRecipe])).rejects.toThrow(/Missing project name/);
    const { template: _t, ...noTemplate } = defaults;
    await expect(runCreate(noTemplate, ctx, [fixtureRecipe])).rejects.toThrow(/Missing --template/);
  });

  it('rejects unsupported package managers from flags and from the launcher', async () => {
    const cwd = await tempDir();
    await expect(
      runCreate({ ...defaults, pm: 'yarn' }, makeContext({ cwd }), [fixtureRecipe]),
    ).rejects.toThrow(UsageError);
    const { pm: _pm, ...noPm } = defaults;
    await expect(
      runCreate(noPm, makeContext({ cwd, env: { npm_config_user_agent: 'bun/1.2.0' } }), [
        fixtureRecipe,
      ]),
    ).rejects.toThrow(/bun/);
  });

  it('uses the package manager that launched it', async () => {
    const cwd = await tempDir();
    const { pm: _pm, ...noPm } = defaults;
    const ctx = makeContext({
      cwd,
      env: { npm_config_user_agent: 'npm/12.1.0 node/v24.18.1' },
    });
    await runCreate({ ...noPm, dryRun: true }, ctx, [fixtureRecipe]);
    expect(ctx.output.results[0]).toMatchObject({ packageManager: 'npm' });
  });

  it('asks for missing values when interactive', async () => {
    const cwd = await tempDir();
    const ctx = makeContext({
      cwd,
      prompter: scriptedPrompter(['prompted-app', 'fixture', 'npm']),
    });
    await runCreate({ install: false, git: false, dryRun: true }, ctx, [fixtureRecipe]);
    expect(ctx.output.results[0]).toMatchObject({
      template: 'fixture',
      packageManager: 'npm',
      target: path.join(cwd, 'prompted-app'),
    });
  });

  it('propagates prompt cancellation without writing anything', async () => {
    const cwd = await tempDir();
    const cancelling: Prompter = {
      text: () => Promise.reject(new CancelledError()),
      select: () => Promise.reject(new CancelledError()),
      confirm: () => Promise.reject(new CancelledError()),
    };
    const { name: _n, ...noName } = defaults;
    await expect(
      runCreate(noName, makeContext({ cwd, prompter: cancelling }), [fixtureRecipe]),
    ).rejects.toThrow(CancelledError);
    expect(await readdir(cwd)).toEqual([]);
  });

  it('cleans up when cancelled during generation', async () => {
    const cwd = await tempDir();
    const controller = new AbortController();
    const runner = fakeRunner(() => {
      controller.abort();
      return { ...okResult(), failed: true, cancelled: true };
    });
    await expect(
      runCreate(defaults, makeContext({ cwd, runner, signal: controller.signal }), [fixtureRecipe]),
    ).rejects.toThrow(CancelledError);
    expect(await readdir(cwd)).toEqual([]);
  });

  it('skips git init inside an existing repository', async () => {
    const cwd = await tempDir();
    const runner = fakeRunner((c) => (c.args[0] === 'rev-parse' ? okResult('true') : okResult()));
    const ctx = makeContext({ cwd, runner });
    await runCreate(defaults, ctx, [fixtureRecipe]);
    expect(runner.calls.some((c) => c.args[0] === 'init')).toBe(false);
    expect(ctx.output.results[0]).toMatchObject({
      steps: [{}, {}, { step: 'git init', status: 'NOT RUN' }],
    });
  });
});
