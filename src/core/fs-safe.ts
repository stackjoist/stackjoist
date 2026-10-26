import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { PreconditionError } from './errors.js';

const MARKER = '.stackjoist-staging';

export type TargetState = 'missing' | 'empty';

async function lstatOrUndefined(p: string) {
  try {
    return await lstat(p);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

/**
 * Resolves where a new project goes. Without an explicit `dir`, the project name
 * (already validated) becomes a direct child of `cwd`.
 */
export function resolveTarget(cwd: string, name: string, dir?: string): string {
  return path.resolve(cwd, dir ?? name);
}

/** Ensures we can create a project at `target` without touching anything that exists. */
export async function checkTarget(target: string): Promise<TargetState> {
  const parent = path.dirname(target);
  const parentStat = await lstatOrUndefined(parent);
  if (!parentStat?.isDirectory()) {
    throw new PreconditionError(`Parent directory does not exist: ${parent}`);
  }

  const stat = await lstatOrUndefined(target);
  if (!stat) return 'missing';
  if (stat.isSymbolicLink()) {
    throw new PreconditionError(
      `Target is a symbolic link: ${target}`,
      'Choose a real directory path.',
    );
  }
  if (!stat.isDirectory()) {
    throw new PreconditionError(`Target exists and is not a directory: ${target}`);
  }
  const entries = await readdir(target);
  if (entries.length > 0) {
    throw new PreconditionError(
      `Target directory is not empty: ${target}`,
      'Choose a new project name or an empty directory. StackJoist never overwrites existing files.',
    );
  }
  return 'empty';
}

/**
 * A temporary sibling directory that receives all generated files. The project
 * only appears at the target path once generation has fully succeeded.
 */
export interface Staging {
  readonly dir: string;
  /** Moves the generated files to the target. */
  finalize(): Promise<void>;
  /** Deletes the staging directory, and only it. Safe to call more than once. */
  discard(): Promise<void>;
}

export async function createStaging(target: string): Promise<Staging> {
  const dir = await mkdtemp(
    path.join(path.dirname(target), `.${path.basename(target)}.stackjoist-`),
  );
  const token = path.basename(dir);
  await writeFile(path.join(dir, MARKER), token);
  let done = false;

  return {
    dir,
    async finalize() {
      await rm(path.join(dir, MARKER));
      const state = await checkTarget(target);
      if (state === 'missing') {
        await rename(dir, target);
      } else {
        // The target is an existing empty directory (possibly the cwd), which
        // cannot be replaced by a rename on every platform: move entries instead.
        for (const entry of await readdir(dir)) {
          await rename(path.join(dir, entry), path.join(target, entry));
        }
        await rmdir(dir);
      }
      done = true;
    },
    async discard() {
      if (done) return;
      // Refuse to delete anything that is not provably our own staging directory.
      const marker = await readFile(path.join(dir, MARKER), 'utf8').catch(() => undefined);
      if (marker !== token) {
        throw new PreconditionError(
          `Refusing to delete ${dir}: staging marker missing or changed.`,
          'Remove the directory manually after checking its contents.',
        );
      }
      await rm(dir, { recursive: true, force: true });
      done = true;
    },
  };
}

/**
 * Resolves a plan-relative path inside `root`, rejecting absolute paths, `..`
 * escapes and writes through symbolic links.
 */
export async function resolveInside(root: string, relative: string): Promise<string> {
  if (path.isAbsolute(relative) || path.win32.isAbsolute(relative)) {
    throw new PreconditionError(`Refusing absolute path in plan: ${relative}`);
  }
  const resolved = path.resolve(root, relative);
  const rel = path.relative(root, resolved);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new PreconditionError(`Refusing path outside the project: ${relative}`);
  }
  let current = root;
  for (const segment of rel.split(path.sep)) {
    current = path.join(current, segment);
    const stat = await lstatOrUndefined(current);
    if (!stat) break;
    if (stat.isSymbolicLink()) {
      throw new PreconditionError(`Refusing to write through symbolic link: ${current}`);
    }
  }
  return resolved;
}

export async function writeFileInside(
  root: string,
  relative: string,
  content: string | Uint8Array,
): Promise<void> {
  const target = await resolveInside(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  // 'wx' fails instead of overwriting if the file already exists.
  await writeFile(target, content, { flag: 'wx' });
}

/** Reads a project file as UTF-8, or returns undefined if it does not exist. */
export async function readFileInside(root: string, relative: string): Promise<string | undefined> {
  const target = await resolveInside(root, relative);
  try {
    return await readFile(target, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

/**
 * Creates or replaces a file via a temporary file and a rename, so a crash never
 * leaves a half-written file behind. Callers are responsible for backups.
 */
export async function replaceFileInside(
  root: string,
  relative: string,
  content: string | Uint8Array,
): Promise<void> {
  const target = await resolveInside(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.stackjoist-tmp-${process.pid}-${Date.now()}`;
  await writeFile(temp, content, { flag: 'wx' });
  try {
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}
