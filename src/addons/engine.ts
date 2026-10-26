import { readFileInside, replaceFileInside } from '../core/fs-safe.js';
import {
  readState,
  serializeState,
  sha256,
  STATE_DIR,
  STATE_FILE,
  type ProjectState,
} from '../core/state.js';
import type { Addon, FileChange } from './types.js';

export const SIDECAR_SUFFIX = '.stackjoist-new';

export type ChangeAction =
  /** File does not exist yet. */
  | 'create'
  /** Managed file the user has not edited: replaced with the new version. */
  | 'update'
  /** User-owned file that gets a merged change. */
  | 'merge'
  /** Already up to date. */
  | 'unchanged'
  /** Identical file already present but not yet tracked: starts being tracked. */
  | 'adopt'
  /** Managed file the user edited: the new version is written next to it. */
  | 'sidecar'
  /** Unmanaged file with different content, or a merge that is not possible. */
  | 'conflict';

export interface PlannedChange {
  path: string;
  action: ChangeAction;
  reason?: string;
  /** What gets written, and where (the path itself, or its sidecar). */
  write?: { path: string; content: string };
  /** Hash to record for managed files once applied. */
  track?: string;
}

export interface AddonPlan {
  addon: Addon;
  state: ProjectState;
  changes: PlannedChange[];
}

async function planOne(
  root: string,
  state: ProjectState,
  change: FileChange,
): Promise<PlannedChange> {
  const current = await readFileInside(root, change.path);

  if (change.kind === 'merge') {
    let next: string;
    try {
      next = change.edit(current);
    } catch (error) {
      return {
        path: change.path,
        action: 'conflict',
        reason: error instanceof Error ? error.message : String(error),
      };
    }
    if (current === next) return { path: change.path, action: 'unchanged' };
    return {
      path: change.path,
      action: current === undefined ? 'create' : 'merge',
      reason: change.description,
      write: { path: change.path, content: next },
    };
  }

  const wanted = sha256(change.content);
  const tracked = state.files[change.path];
  if (current === undefined) {
    return {
      path: change.path,
      action: 'create',
      write: { path: change.path, content: change.content },
      track: wanted,
    };
  }
  const actual = sha256(current);
  if (actual === wanted) {
    return { path: change.path, action: tracked ? 'unchanged' : 'adopt', track: wanted };
  }
  const sidecar = { path: `${change.path}${SIDECAR_SUFFIX}`, content: change.content };
  if (tracked?.sha256 === actual) {
    return {
      path: change.path,
      action: 'update',
      write: { path: change.path, content: change.content },
      track: wanted,
    };
  }
  if (tracked) {
    return { path: change.path, action: 'sidecar', reason: 'you edited this file', write: sidecar };
  }
  return {
    path: change.path,
    action: 'conflict',
    reason: 'a different file already exists here',
    write: sidecar,
  };
}

/** Works out what applying the add-on would do. Reads only. */
export async function planAddon(
  root: string,
  addon: Addon,
  fileChanges: readonly FileChange[],
): Promise<AddonPlan> {
  const state = await readState(root);
  const changes: PlannedChange[] = [];
  for (const change of fileChanges) changes.push(await planOne(root, state, change));
  return { addon, state, changes };
}

export function hasWork(plan: AddonPlan): boolean {
  const recorded = plan.state.addons[plan.addon.id];
  return (
    plan.changes.some((c) => c.action !== 'unchanged') || recorded?.version !== plan.addon.version
  );
}

export interface ApplyResult {
  written: string[];
  backups: string[];
  backupDir: string | undefined;
}

/**
 * Applies a plan. Every existing file that is replaced is first copied to
 * `.stackjoist/backups/<timestamp>/`. Conflicts are applied only as sidecar files.
 */
export async function applyAddon(
  root: string,
  plan: AddonPlan,
  now: Date = new Date(),
): Promise<ApplyResult> {
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const backupDir = `${STATE_DIR}/backups/${stamp}`;
  const written: string[] = [];
  const backups: string[] = [];
  const state = structuredClone(plan.state);

  for (const change of plan.changes) {
    if (change.write) {
      const existing = await readFileInside(root, change.write.path);
      if (existing !== undefined) {
        const backupPath = `${backupDir}/${change.write.path}`;
        await replaceFileInside(root, backupPath, existing);
        backups.push(backupPath);
      }
      await replaceFileInside(root, change.write.path, change.write.content);
      written.push(change.write.path);
    }
    if (change.track && change.action !== 'sidecar' && change.action !== 'conflict') {
      state.files[change.path] = { addon: plan.addon.id, sha256: change.track };
    }
  }

  const previous = state.addons[plan.addon.id];
  state.addons[plan.addon.id] = {
    version: plan.addon.version,
    installedAt: previous?.installedAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  };
  // Backups are local recovery data, not project history.
  if ((await readFileInside(root, `${STATE_DIR}/.gitignore`)) === undefined) {
    await replaceFileInside(root, `${STATE_DIR}/.gitignore`, 'backups/\n');
  }
  await replaceFileInside(root, STATE_FILE, serializeState(state));
  return { written, backups, backupDir: backups.length > 0 ? backupDir : undefined };
}
