// Packs the package, inspects the tarball and runs the CLI from a clean install.
// This is what users get from npm, so it must work without the source tree.
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const work = await mkdtemp(path.join(os.tmpdir(), 'stackjoist-pack-'));
const failures = [];

function check(condition, message) {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${message}`);
  if (!condition) failures.push(message);
}

try {
  const { stdout } = await execa('npm', ['pack', '--json', '--pack-destination', work], {
    cwd: root,
  });
  // npm <= 11 prints an array; npm 12 prints an object keyed by package name.
  const parsed = JSON.parse(stdout);
  const info = Array.isArray(parsed) ? parsed[0] : parsed[pkg.name];
  const files = info.files.map((f) => f.path);

  check(files.includes('dist/cli/index.js'), 'tarball contains dist/cli/index.js');
  check(files.includes('LICENSE'), 'tarball contains LICENSE');
  check(files.includes('README.md'), 'tarball contains README.md');
  for (const file of [
    'assets/ai/AGENTS.md',
    'assets/ai/workflow.json',
    'assets/ai/hooks/stackjoist-bash-guard.mjs',
    'assets/ai/skills/orchestrate/SKILL.md',
  ]) {
    check(files.includes(file), `tarball contains ${file}`);
  }
  for (const asset of ['_gitignore', '.env.example', '.prettierrc.json', 'src/server.ts']) {
    const file = `assets/templates/express-mongoose/${asset}`;
    check(files.includes(file), `tarball contains ${file}`);
  }
  // Template files are shipped on purpose (including their tests); everything else is checked.
  const forbidden = files.filter(
    (f) =>
      /(^|\/)\.env$|(^|\/)node_modules\//.test(f) ||
      (!f.startsWith('assets/templates/') &&
        /^(src|test|docs|scripts)\/|\.test\.|^AGENTS\.md$|^CLAUDE\.md$/.test(f)),
  );
  check(
    forbidden.length === 0,
    `tarball has no source/test/doc/secret files ${forbidden.join(', ')}`,
  );

  const app = path.join(work, 'consumer');
  await mkdir(app);
  await writeFile(
    path.join(app, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true }),
  );
  await execa('npm', ['install', '--no-audit', '--no-fund', path.join(work, info.filename)], {
    cwd: app,
  });

  const installed = path.join(app, 'node_modules', pkg.name);
  const entry = await readFile(path.join(installed, 'dist', 'cli', 'index.js'), 'utf8');
  check(entry.startsWith('#!/usr/bin/env node'), 'entry has the node shebang');

  const bin = (name, args) =>
    execa(name, args, { cwd: app, preferLocal: true, localDir: app, reject: false });

  const version = await bin('create-stackjoist', ['--version']);
  check(
    version.exitCode === 0 && version.stdout.trim() === pkg.version,
    'create-stackjoist --version',
  );

  const help = await bin('create-stackjoist', ['create', '--help']);
  check(
    help.exitCode === 0 && help.stdout.includes('--dry-run'),
    'create-stackjoist create --help',
  );

  const list = await bin('stackjoist', ['list', '--json']);
  check(
    list.exitCode === 0 && Array.isArray(JSON.parse(list.stdout).templates),
    'stackjoist list --json',
  );

  const doctor = await bin('stackjoist', ['doctor', '--json']);
  check(doctor.exitCode === 0 && JSON.parse(doctor.stdout).ok === true, 'stackjoist doctor --json');

  // Proves templates resolve from node_modules, not from the source tree.
  const generated = await bin('create-stackjoist', [
    'demo',
    '--template',
    'express-mongoose',
    '--pm',
    'npm',
    '--no-install',
    '--no-git',
    '--json',
  ]);
  const demoFiles = generated.exitCode === 0 ? await readdir(path.join(app, 'demo')) : [];
  check(
    demoFiles.includes('.gitignore') && demoFiles.includes('package.json'),
    'installed package generates express-mongoose',
  );

  const added = await bin('stackjoist', ['add', 'ai-workflows', '--yes', '--json']);
  const claudeFiles = added.exitCode === 0 ? await readdir(path.join(app, '.claude')) : [];
  check(
    claudeFiles.includes('skills') && claudeFiles.includes('settings.json'),
    'installed package applies ai-workflows',
  );
} finally {
  await rm(work, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} pack check(s) failed.`);
  process.exit(1);
}
console.log('\nAll pack checks passed.');
