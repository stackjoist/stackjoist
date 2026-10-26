import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../helpers.js';

// Runs the built CLI (pnpm test:cli builds first) as a real child process.
const cli = fileURLToPath(new URL('../../dist/cli/index.js', import.meta.url));
const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8')) as {
  version: string;
};

async function run(args: string[], cwd?: string) {
  return execa('node', [cli, ...args], { reject: false, ...(cwd ? { cwd } : {}) });
}

describe('CLI', () => {
  it('prints help with examples', async () => {
    const r = await run(['create', '--help']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('npm create stackjoist@latest my-app');
    expect(r.stdout).toContain('--dry-run');
  });

  it('prints the package version', async () => {
    const r = await run(['--version']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe(pkg.version);
  });

  it('exits 2 on unknown options', async () => {
    const r = await run(['list', '--nope']);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain("unknown option '--nope'");
  });

  it('lists templates and add-ons as JSON', async () => {
    const r = await run(['list', '--json']);
    expect(r.exitCode).toBe(0);
    const body = JSON.parse(r.stdout) as { templates: { id: string }[]; addons: unknown[] };
    expect(body.templates.map((t) => t.id)).toContain('express-mongoose');
    expect(body.addons.map((a) => (a as { id: string }).id)).toEqual(['ai-workflows', 'ci-github']);
  });

  it('runs doctor and returns structured checks', async () => {
    const r = await run(['doctor', '--json']);
    const body = JSON.parse(r.stdout) as { ok: boolean; checks: Array<{ name: string }> };
    expect(body.checks.map((c) => c.name)).toEqual([
      'node',
      'npm',
      'pnpm',
      'git',
      'package manager',
    ]);
    expect(r.exitCode).toBe(body.ok ? 0 : 3);
  });

  it('rejects an invalid project name with exit code 2 and writes nothing', async () => {
    const cwd = await tempDir();
    const r = await run(['../evil', '--yes', '--json'], cwd);
    expect(r.exitCode).toBe(2);
    expect(JSON.parse(r.stdout)).toMatchObject({ ok: false, exitCode: 2 });
    expect(await readdir(cwd)).toEqual([]);
  });

  it('requires --template when it cannot prompt, and names the options', async () => {
    const cwd = await tempDir();
    const r = await run(['my-app', '--yes', '--json'], cwd);
    expect(r.exitCode).toBe(2);
    expect(JSON.parse(r.stdout)).toMatchObject({ ok: false, exitCode: 2 });
    expect(r.stdout).toContain('express-mongoose');
    expect(await readdir(cwd)).toEqual([]);
  });

  it('dry-runs a real template without writing anything', async () => {
    const cwd = await tempDir();
    const r = await run(
      ['my-api', '--template', 'express-mongoose', '--pm', 'pnpm', '--dry-run', '--json'],
      cwd,
    );
    expect(r.exitCode).toBe(0);
    const body = JSON.parse(r.stdout) as { plan: string[] };
    expect(body.plan).toContain('create  .gitignore');
    expect(body.plan).toContain('create  pnpm-workspace.yaml');
    expect(body.plan).toContain('run     pnpm install');
    expect(await readdir(cwd)).toEqual([]);
  });

  it('generates a real template without installing', async () => {
    const cwd = await tempDir();
    const r = await run(
      [
        'my-api',
        '--template',
        'express-mongoose',
        '--pm',
        'npm',
        '--no-install',
        '--no-git',
        '--json',
      ],
      cwd,
    );
    expect(r.exitCode).toBe(0);
    expect(await readdir(cwd)).toEqual(['my-api']);
    const files = await readdir(path.join(cwd, 'my-api'));
    expect(files).toEqual(expect.arrayContaining(['package.json', '.gitignore', 'src', 'test']));
  });

  it('previews an add-on without writing anything', async () => {
    const cwd = await tempDir();
    await writeFile(path.join(cwd, 'package.json'), '{"name":"demo"}');
    const r = await run(['add', 'ai-workflows', '--dry-run', '--json'], cwd);
    expect(r.exitCode).toBe(0);
    const body = JSON.parse(r.stdout) as { changes: Array<{ path: string; action: string }> };
    expect(body.changes).toContainEqual({ path: 'AGENTS.md', action: 'create' });
    expect(await readdir(cwd)).toEqual(['package.json']);
  });
});
