// Full recipe verification: generate each recipe with each package manager using the
// built CLI, install for real, then run the generated project's own checks.
// Usage: node scripts/verify-recipes.mjs [--recipe <id>] [--pm npm|pnpm] [--keep]
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = path.join(root, 'dist', 'cli', 'index.js');
const { execaRunner } = await import(new URL('../dist/core/exec.js', import.meta.url).href);
const { recipes } = await import(new URL('../dist/recipes/registry.js', import.meta.url).href);
const { runVerify } = await import(new URL('../dist/verify/run.js', import.meta.url).href);

const { values } = parseArgs({
  options: {
    recipe: { type: 'string', multiple: true },
    pm: { type: 'string', multiple: true },
    keep: { type: 'boolean', default: false },
  },
});
const selected = recipes.filter((r) => !values.recipe || values.recipe.includes(r.id));
const packageManagers = values.pm ?? ['npm', 'pnpm'];
const report = [];

async function dockerAvailable() {
  const r = await execa('docker', ['compose', 'version'], { reject: false });
  return !r.failed;
}
const hasDocker = await dockerAvailable();

for (const recipe of selected) {
  for (const pm of packageManagers) {
    const label = `${recipe.id} / ${pm}`;
    const work = await mkdtemp(path.join(os.tmpdir(), 'stackjoist-recipe-'));
    const project = path.join(work, 'app');
    console.log(`\n=== ${label}  (${project})`);
    const rows = [];
    try {
      const started = Date.now();
      const create = await execa(
        'node',
        [cli, 'app', '--template', recipe.id, '--pm', pm, '--yes', '--no-git', '--json'],
        { cwd: work, reject: false },
      );
      rows.push({
        name: 'create + install',
        status: create.exitCode === 0 ? 'PASS' : 'FAIL',
        durationMs: Date.now() - started,
        ...(create.exitCode === 0
          ? {}
          : { output: `${create.stdout}\n${create.stderr}`.slice(-4000) }),
      });
      if (create.exitCode === 0) {
        rows.push(
          ...(await runVerify(recipe.verify, {
            cwd: project,
            packageManager: pm,
            runner: execaRunner,
            timeoutMs: 15 * 60_000,
          })),
        );
        if (hasDocker) {
          const compose = await execa('docker', ['compose', 'config', '--quiet'], {
            cwd: project,
            reject: false,
          });
          rows.push({ name: 'docker compose config', status: compose.failed ? 'FAIL' : 'PASS' });
        } else {
          rows.push({
            name: 'docker compose config',
            status: 'BLOCKED',
            output: 'docker not installed',
          });
        }
      } else {
        for (const step of recipe.verify) rows.push({ name: step.name, status: 'NOT RUN' });
      }
    } finally {
      if (!values.keep) await rm(work, { recursive: true, force: true });
    }
    for (const row of rows) {
      const secs = row.durationMs === undefined ? '' : ` (${(row.durationMs / 1000).toFixed(1)}s)`;
      console.log(`${row.status.padEnd(8)} ${row.name}${secs}`);
      if (row.status === 'FAIL' && row.output) console.log(row.output);
      if (row.status === 'BLOCKED' && row.output) console.log(`         ${row.output}`);
    }
    report.push({ label, rows });
  }
}

const failed = report.filter((r) => r.rows.some((row) => row.status === 'FAIL'));
console.log(`\n${report.length - failed.length}/${report.length} recipe runs passed.`);
if (failed.length > 0) process.exit(1);
