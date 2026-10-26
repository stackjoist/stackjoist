import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PreconditionError } from '../../src/core/errors.js';
import { inspectProject } from '../../src/core/project.js';
import { tempDir } from '../helpers.js';

describe('inspectProject', () => {
  it('reads scripts, frameworks and lockfiles', async () => {
    const root = await tempDir();
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'api',
        packageManager: 'pnpm@12.15.0',
        scripts: { test: 'vitest', bad: 42 },
        dependencies: { express: '^5', mongoose: '^9' },
        devDependencies: { '@nestjs/core': '^12' },
      }),
    );
    await writeFile(path.join(root, 'pnpm-lock.yaml'), '');
    const info = await inspectProject(root);
    expect(info.manifest).toEqual({
      name: 'api',
      packageManager: 'pnpm@12.15.0',
      scripts: { test: 'vitest' },
      dependencies: { express: '^5', mongoose: '^9' },
      devDependencies: { '@nestjs/core': '^12' },
    });
    expect(info.frameworks).toEqual(['express', 'mongoose', 'nestjs']);
    expect(info.packageManagers).toEqual(['pnpm']);
    expect(info.hasGit).toBe(false);
  });

  it('accepts a git repository without package.json', async () => {
    const root = await tempDir();
    await mkdir(path.join(root, '.git'));
    expect((await inspectProject(root)).manifest).toBeUndefined();
  });

  it.each([
    ['not a project', null],
    ['invalid package.json', '{ nope'],
    ['non-object package.json', '[1]'],
  ])('rejects %s', async (_label, pkg) => {
    const root = await tempDir();
    if (pkg !== null) await writeFile(path.join(root, 'package.json'), pkg);
    await expect(inspectProject(root)).rejects.toThrow(PreconditionError);
  });
});
