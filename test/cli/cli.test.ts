import { readdir, readFile } from 'node:fs/promises';
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
    expect(JSON.parse(r.stdout)).toEqual({ templates: [], addons: [] });
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

  it('reports that no recipes exist yet with exit code 3', async () => {
    const cwd = await tempDir();
    const r = await run(['my-app', '--yes', '--json'], cwd);
    expect(r.exitCode).toBe(3);
    expect(JSON.parse(r.stdout)).toMatchObject({ ok: false, exitCode: 3 });
    expect(await readdir(cwd)).toEqual([]);
  });
});
