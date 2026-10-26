import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PreconditionError } from './errors.js';

export const STATE_DIR = '.stackjoist';
export const STATE_FILE = `${STATE_DIR}/state.json`;

/** What StackJoist has installed into a project, so updates never clobber user edits. */
export interface ProjectState {
  version: 1;
  addons: Record<string, { version: string; installedAt: string; updatedAt: string }>;
  /** Managed files by project-relative path: the hash of the content StackJoist last wrote. */
  files: Record<string, { addon: string; sha256: string }>;
}

export function emptyState(): ProjectState {
  return { version: 1, addons: {}, files: {} };
}

export function sha256(content: string | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}

export async function readState(root: string): Promise<ProjectState> {
  let text: string;
  try {
    text = await readFile(path.join(root, STATE_FILE), 'utf8');
  } catch {
    return emptyState();
  }
  try {
    const parsed = JSON.parse(text) as Partial<ProjectState>;
    if (
      parsed.version !== 1 ||
      typeof parsed.addons !== 'object' ||
      typeof parsed.files !== 'object'
    ) {
      throw new Error('unexpected shape');
    }
    return parsed as ProjectState;
  } catch {
    throw new PreconditionError(
      `${STATE_FILE} is not valid.`,
      'Restore it from git, or delete it to let StackJoist treat all files as unmanaged.',
    );
  }
}

export function serializeState(state: ProjectState): string {
  return `${JSON.stringify(state, null, 2)}\n`;
}
