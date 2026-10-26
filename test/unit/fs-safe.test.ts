import { mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PreconditionError } from '../../src/core/errors.js';
import {
  checkTarget,
  createStaging,
  resolveInside,
  resolveTarget,
  writeFileInside,
} from '../../src/core/fs-safe.js';
import { tempDir } from '../helpers.js';

describe('resolveTarget', () => {
  it('places the project directly under cwd by default', () => {
    expect(resolveTarget('/work', 'my-app')).toBe(path.resolve('/work', 'my-app'));
  });

  it('honours an explicit --dir', () => {
    expect(resolveTarget('/work', 'my-app', 'apps/web')).toBe(path.resolve('/work', 'apps/web'));
  });
});

describe('checkTarget', () => {
  it('accepts a missing target', async () => {
    const root = await tempDir();
    expect(await checkTarget(path.join(root, 'new'))).toBe('missing');
  });

  it('accepts an empty directory', async () => {
    const root = await tempDir();
    await mkdir(path.join(root, 'empty'));
    expect(await checkTarget(path.join(root, 'empty'))).toBe('empty');
  });

  it('rejects a non-empty directory', async () => {
    const root = await tempDir();
    await mkdir(path.join(root, 'full'));
    await writeFile(path.join(root, 'full', 'keep.txt'), 'user data');
    await expect(checkTarget(path.join(root, 'full'))).rejects.toThrow(/not empty/);
  });

  it('rejects a file', async () => {
    const root = await tempDir();
    await writeFile(path.join(root, 'file'), '');
    await expect(checkTarget(path.join(root, 'file'))).rejects.toThrow(/not a directory/);
  });

  it('rejects a symbolic link', async () => {
    const root = await tempDir();
    await mkdir(path.join(root, 'real'));
    // Junctions need no admin rights on Windows; elsewhere this is a normal dir symlink.
    await symlink(path.join(root, 'real'), path.join(root, 'link'), 'junction');
    await expect(checkTarget(path.join(root, 'link'))).rejects.toThrow(/symbolic link/);
  });

  it('rejects a missing parent directory', async () => {
    const root = await tempDir();
    await expect(checkTarget(path.join(root, 'nope', 'app'))).rejects.toThrow(/Parent directory/);
  });
});

describe('resolveInside', () => {
  it.each(['../outside', 'a/../../outside', '/etc/passwd', 'C:\\Windows\\x', '.', ''])(
    'rejects %j',
    async (rel) => {
      const root = await tempDir();
      await expect(resolveInside(root, rel)).rejects.toThrow(PreconditionError);
    },
  );

  it('rejects writing through a symbolic link inside the root', async () => {
    const root = await tempDir();
    const outside = await tempDir();
    await symlink(outside, path.join(root, 'link'), 'junction');
    await expect(resolveInside(root, 'link/file.txt')).rejects.toThrow(/symbolic link/);
  });

  it('accepts nested relative paths', async () => {
    const root = await tempDir();
    expect(await resolveInside(root, 'src/index.ts')).toBe(path.join(root, 'src', 'index.ts'));
  });
});

describe('writeFileInside', () => {
  it('creates parent directories', async () => {
    const root = await tempDir();
    await writeFileInside(root, 'a/b/c.txt', 'hi');
    expect(await readFile(path.join(root, 'a', 'b', 'c.txt'), 'utf8')).toBe('hi');
  });

  it('never overwrites an existing file', async () => {
    const root = await tempDir();
    await writeFile(path.join(root, 'x.txt'), 'original');
    await expect(writeFileInside(root, 'x.txt', 'new')).rejects.toThrow();
    expect(await readFile(path.join(root, 'x.txt'), 'utf8')).toBe('original');
  });
});

describe('createStaging', () => {
  it('moves generated files to a missing target on finalize', async () => {
    const root = await tempDir();
    const target = path.join(root, 'app');
    const staging = await createStaging(target);
    await writeFile(path.join(staging.dir, 'file.txt'), 'x');
    await staging.finalize();
    expect(await readdir(target)).toEqual(['file.txt']);
    expect(await readdir(root)).toEqual(['app']);
  });

  it('moves entries into an existing empty target', async () => {
    const root = await tempDir();
    const target = path.join(root, 'app');
    await mkdir(target);
    const staging = await createStaging(target);
    await writeFile(path.join(staging.dir, 'file.txt'), 'x');
    await staging.finalize();
    expect(await readdir(target)).toEqual(['file.txt']);
    expect(await readdir(root)).toEqual(['app']);
  });

  it('discard removes only the staging directory', async () => {
    const root = await tempDir();
    await writeFile(path.join(root, 'user.txt'), 'keep me');
    const staging = await createStaging(path.join(root, 'app'));
    await writeFile(path.join(staging.dir, 'partial.txt'), 'x');
    await staging.discard();
    expect(await readdir(root)).toEqual(['user.txt']);
  });

  it('refuses to discard when the marker was tampered with', async () => {
    const root = await tempDir();
    const staging = await createStaging(path.join(root, 'app'));
    await writeFile(path.join(staging.dir, '.stackjoist-staging'), 'something else');
    await expect(staging.discard()).rejects.toThrow(/Refusing to delete/);
    expect((await readdir(root)).length).toBe(1);
  });

  it('refuses to finalize if the target was filled meanwhile', async () => {
    const root = await tempDir();
    const target = path.join(root, 'app');
    const staging = await createStaging(target);
    await mkdir(target);
    await writeFile(path.join(target, 'race.txt'), 'user');
    await expect(staging.finalize()).rejects.toThrow(/not empty/);
    expect(await readdir(target)).toEqual(['race.txt']);
  });
});
