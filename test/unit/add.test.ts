import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { addons } from '../../src/addons/registry.js';
import { runAdd } from '../../src/commands/add.js';
import { PreconditionError, UsageError } from '../../src/core/errors.js';
import { fakeRunner, makeContext, okResult, scriptedPrompter, tempDir } from '../helpers.js';

async function project(files: Record<string, string> = {}) {
  const root = await tempDir();
  await writeFile(
    path.join(root, 'package.json'),
    '{"name":"demo","scripts":{"test":"vitest run"}}',
  );
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  }
  return root;
}

const opts = { id: 'ai-workflows', dryRun: false, yes: true };

describe('runAdd', () => {
  it('rejects unknown add-ons and lists the available ones', async () => {
    const error = await runAdd(
      { ...opts, id: 'nope' },
      makeContext({ cwd: await project() }),
      addons,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UsageError);
    expect((error as UsageError).hint).toContain('ai-workflows');
  });

  it('refuses directories that are not projects', async () => {
    await expect(runAdd(opts, makeContext({ cwd: await tempDir() }), addons)).rejects.toThrow(
      /does not look like a project/,
    );
  });

  it('dry run lists changes and writes nothing', async () => {
    const root = await project();
    const ctx = makeContext({ cwd: root });
    await runAdd({ ...opts, dryRun: true }, ctx, addons);
    expect(await readdir(root)).toEqual(['package.json']);
    expect(ctx.output.results[0]).toMatchObject({ ok: true, dryRun: true });
  });

  it('installs the AI workflow, passes its checks, and is a no-op the second time', async () => {
    const root = await project();
    const ctx = makeContext({ cwd: root });
    await runAdd(opts, ctx, addons);
    const result = ctx.output.results[0] as { ok: boolean; checks: Array<{ status: string }> };
    expect(result.ok).toBe(true);
    expect(result.checks.filter((c) => c.status === 'FAIL')).toEqual([]);
    expect(await readFile(path.join(root, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n');
    expect(await readdir(path.join(root, '.claude', 'skills'))).toHaveLength(11);

    const again = makeContext({ cwd: root });
    await runAdd(opts, again, addons);
    expect(again.output.results[0]).toMatchObject({ upToDate: true });
  });

  it('keeps an existing CLAUDE.md and only adds the import line', async () => {
    const root = await project({ 'CLAUDE.md': '# Team notes\n' });
    await runAdd(opts, makeContext({ cwd: root }), addons);
    expect(await readFile(path.join(root, 'CLAUDE.md'), 'utf8')).toBe(
      '# Team notes\n\n@AGENTS.md\n',
    );
  });

  it('refuses conflicts under --yes and leaves files untouched', async () => {
    const root = await project({ 'AGENTS.md': '# Our own policy\n' });
    await expect(runAdd(opts, makeContext({ cwd: root }), addons)).rejects.toThrow(
      PreconditionError,
    );
    expect(await readFile(path.join(root, 'AGENTS.md'), 'utf8')).toBe('# Our own policy\n');
    expect(await readdir(root)).toEqual(['AGENTS.md', 'package.json']);
  });

  it('after interactive confirmation writes conflicting versions as sidecars', async () => {
    const root = await project({ 'AGENTS.md': '# Our own policy\n' });
    const ctx = makeContext({ cwd: root, prompter: scriptedPrompter([true]) });
    await runAdd({ ...opts, yes: false }, ctx, addons).catch(() => undefined);
    expect(await readFile(path.join(root, 'AGENTS.md'), 'utf8')).toBe('# Our own policy\n');
    expect(await readdir(root)).toContain('AGENTS.md.stackjoist-new');
  });

  it('requires --yes when it cannot ask', async () => {
    const root = await project();
    await expect(
      runAdd({ ...opts, yes: false }, makeContext({ cwd: root }), addons),
    ).rejects.toThrow(/without confirmation/);
    expect(await readdir(root)).toEqual(['package.json']);
  });

  it('does nothing when the user declines', async () => {
    const root = await project();
    const ctx = makeContext({ cwd: root, prompter: scriptedPrompter([false]) });
    await runAdd({ ...opts, yes: false }, ctx, addons);
    expect(await readdir(root)).toEqual(['package.json']);
  });

  it('refuses to merge into an invalid .claude/settings.json', async () => {
    const root = await project({ '.claude/settings.json': '{ broken' });
    await expect(runAdd(opts, makeContext({ cwd: root }), addons)).rejects.toThrow(/Cannot merge/);
    expect(await readFile(path.join(root, '.claude/settings.json'), 'utf8')).toBe('{ broken');
  });

  it('adds CI for a pnpm project using the local pnpm version', async () => {
    const root = await project({ 'pnpm-lock.yaml': '' });
    const runner = fakeRunner(() => okResult('12.15.0'));
    await runAdd({ ...opts, id: 'ci-github' }, makeContext({ cwd: root, runner }), addons);
    const yml = await readFile(path.join(root, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('version: 12');
    expect(yml).toContain('pnpm install --frozen-lockfile');
    expect(yml).toContain('pnpm run test');
  });

  it('explains why CI cannot be added without a lockfile', async () => {
    await expect(
      runAdd({ ...opts, id: 'ci-github' }, makeContext({ cwd: await project() }), addons),
    ).rejects.toThrow(/no lockfile/);
  });
});
