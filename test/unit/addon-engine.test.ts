import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyAddon, hasWork, planAddon } from '../../src/addons/engine.js';
import type { Addon, FileChange } from '../../src/addons/types.js';
import { readState } from '../../src/core/state.js';
import { tempDir } from '../helpers.js';

function fakeAddon(version = '1.0.0'): Addon {
  return {
    id: 'fake',
    title: 'Fake',
    description: 'test',
    version,
    incompatibility: () => undefined,
    changes: () => Promise.resolve([]),
    verify: () => Promise.resolve([]),
    limitations: [],
    nextSteps: [],
  };
}

const managed = (content: string): FileChange => ({ kind: 'managed', path: 'cfg/a.txt', content });

async function install(root: string, changes: FileChange[], version = '1.0.0') {
  const plan = await planAddon(root, fakeAddon(version), changes);
  if (hasWork(plan)) await applyAddon(root, plan);
  return plan;
}

const read = (root: string, p: string) => readFile(path.join(root, p), 'utf8');

describe('add-on engine', () => {
  it('creates files, records hashes, and is a no-op the second time', async () => {
    const root = await tempDir();
    const first = await install(root, [managed('v1')]);
    expect(first.changes.map((c) => c.action)).toEqual(['create']);
    expect(await read(root, 'cfg/a.txt')).toBe('v1');
    const state = await readState(root);
    expect(state.files['cfg/a.txt']?.addon).toBe('fake');
    expect(state.addons['fake']?.version).toBe('1.0.0');

    const stateText = await read(root, '.stackjoist/state.json');
    const second = await planAddon(root, fakeAddon(), [managed('v1')]);
    expect(second.changes.map((c) => c.action)).toEqual(['unchanged']);
    expect(hasWork(second)).toBe(false);
    expect(await read(root, '.stackjoist/state.json')).toBe(stateText);
  });

  it('updates a managed file the user has not edited, keeping a backup', async () => {
    const root = await tempDir();
    await install(root, [managed('v1')]);
    const plan = await planAddon(root, fakeAddon('1.1.0'), [managed('v2')]);
    expect(plan.changes[0]?.action).toBe('update');
    const result = await applyAddon(root, plan);
    expect(await read(root, 'cfg/a.txt')).toBe('v2');
    expect(result.backups).toHaveLength(1);
    expect(await read(root, result.backups[0] ?? '')).toBe('v1');
  });

  it('never overwrites a managed file the user edited: writes a sidecar instead', async () => {
    const root = await tempDir();
    await install(root, [managed('v1')]);
    await writeFile(path.join(root, 'cfg/a.txt'), 'my edits');
    const plan = await planAddon(root, fakeAddon('1.1.0'), [managed('v2')]);
    expect(plan.changes[0]?.action).toBe('sidecar');
    await applyAddon(root, plan);
    expect(await read(root, 'cfg/a.txt')).toBe('my edits');
    expect(await read(root, 'cfg/a.txt.stackjoist-new')).toBe('v2');
    // The recorded hash still describes v1, so the next update still sees the user edit.
    const again = await planAddon(root, fakeAddon('1.2.0'), [managed('v3')]);
    expect(again.changes[0]?.action).toBe('sidecar');
  });

  it('reports an unmanaged, different file as a conflict', async () => {
    const root = await tempDir();
    await mkdir(path.join(root, 'cfg'));
    await writeFile(path.join(root, 'cfg/a.txt'), 'theirs');
    const plan = await planAddon(root, fakeAddon(), [managed('ours')]);
    expect(plan.changes[0]).toMatchObject({
      action: 'conflict',
      write: { path: 'cfg/a.txt.stackjoist-new' },
    });
  });

  it('adopts an identical unmanaged file without rewriting it', async () => {
    const root = await tempDir();
    await mkdir(path.join(root, 'cfg'));
    await writeFile(path.join(root, 'cfg/a.txt'), 'same');
    const plan = await install(root, [managed('same')]);
    expect(plan.changes[0]?.action).toBe('adopt');
    expect((await readState(root)).files['cfg/a.txt']).toBeDefined();
  });

  it('merges into user files with a backup, and reports merges that cannot be done', async () => {
    const root = await tempDir();
    await writeFile(path.join(root, 'notes.txt'), 'user\n');
    const append: FileChange = {
      kind: 'merge',
      path: 'notes.txt',
      description: 'append line',
      edit: (c) => (c?.includes('added') ? c : `${c ?? ''}added\n`),
    };
    const plan = await planAddon(root, fakeAddon(), [append]);
    expect(plan.changes[0]?.action).toBe('merge');
    const result = await applyAddon(root, plan);
    expect(await read(root, 'notes.txt')).toBe('user\nadded\n');
    expect(await read(root, result.backups[0] ?? '')).toBe('user\n');

    const broken: FileChange = {
      kind: 'merge',
      path: 'notes.txt',
      description: 'x',
      edit: () => {
        throw new Error('cannot parse');
      },
    };
    const failed = await planAddon(root, fakeAddon(), [broken]);
    expect(failed.changes[0]).toMatchObject({ action: 'conflict', reason: 'cannot parse' });
    expect(failed.changes[0]?.write).toBeUndefined();
  });

  it('keeps backups out of git', async () => {
    const root = await tempDir();
    await install(root, [managed('v1')]);
    expect(await read(root, '.stackjoist/.gitignore')).toBe('backups/\n');
    expect(await readdir(path.join(root, '.stackjoist'))).toContain('state.json');
  });

  it('refuses paths that escape the project', async () => {
    const root = await tempDir();
    await expect(
      planAddon(root, fakeAddon(), [{ kind: 'managed', path: '../evil.txt', content: 'x' }]),
    ).rejects.toThrow(/outside/);
  });
});
