import type { CheckStatus } from '../core/output.js';
import type { ProjectInfo } from '../core/project.js';

/**
 * A file the add-on owns completely. StackJoist tracks its hash and replaces it on
 * update only while the user has not edited it.
 */
export interface ManagedFile {
  kind: 'managed';
  path: string;
  content: string;
}

/**
 * A change merged into a file the user owns (for example `.claude/settings.json`).
 * `edit` must be idempotent: applying it to its own output returns the same text.
 * It throws if the existing content cannot be merged safely.
 */
export interface MergedFile {
  kind: 'merge';
  path: string;
  description: string;
  edit(current: string | undefined): string;
}

export type FileChange = ManagedFile | MergedFile;

export interface AddonContext {
  project: ProjectInfo;
  /** Locally installed pnpm version, when the project uses pnpm and pnpm is available. */
  pnpmVersion: string | undefined;
}

export interface AddonCheck {
  name: string;
  status: CheckStatus;
  detail?: string;
}

export interface Addon {
  id: string;
  title: string;
  description: string;
  version: string;
  /** Returns a reason when the add-on cannot be applied to this project. */
  incompatibility(ctx: AddonContext): string | undefined;
  changes(ctx: AddonContext): Promise<FileChange[]>;
  /** Checks run after applying, against the files on disk. */
  verify(root: string): Promise<AddonCheck[]>;
  limitations: readonly string[];
  nextSteps: readonly string[];
}
