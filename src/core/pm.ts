import { access } from 'node:fs/promises';
import path from 'node:path';
import { UsageError } from './errors.js';

export const SUPPORTED_PACKAGE_MANAGERS = ['npm', 'pnpm'] as const;
export type PackageManagerId = (typeof SUPPORTED_PACKAGE_MANAGERS)[number];

export type KnownPackageManager = PackageManagerId | 'yarn' | 'bun';

export function isSupported(pm: string): pm is PackageManagerId {
  return (SUPPORTED_PACKAGE_MANAGERS as readonly string[]).includes(pm);
}

/** Reads the package manager that launched us, e.g. `pnpm/12.15.0 npm/? node/v24…`. */
export function detectFromUserAgent(
  userAgent: string | undefined,
): KnownPackageManager | undefined {
  const name = userAgent?.split(' ')[0]?.split('/')[0];
  switch (name) {
    case 'npm':
    case 'pnpm':
    case 'yarn':
    case 'bun':
      return name;
    default:
      return undefined;
  }
}

const LOCKFILES: ReadonlyArray<[string, KnownPackageManager]> = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['package-lock.json', 'npm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
];

/** Returns every package manager with a lockfile in `dir` (more than one is a conflict). */
export async function detectFromLockfiles(dir: string): Promise<KnownPackageManager[]> {
  const found: KnownPackageManager[] = [];
  for (const [file, pm] of LOCKFILES) {
    try {
      await access(path.join(dir, file));
      if (!found.includes(pm)) found.push(pm);
    } catch {
      // not present
    }
  }
  return found;
}

export function assertSupported(pm: string): PackageManagerId {
  if (isSupported(pm)) return pm;
  throw new UsageError(
    `Package manager "${pm}" is not supported in this version.`,
    `Use one of: ${SUPPORTED_PACKAGE_MANAGERS.join(', ')} (for example --pm pnpm).`,
  );
}

export function installCommand(pm: PackageManagerId): { file: string; args: string[] } {
  return { file: pm, args: ['install'] };
}

export function runScriptCommand(
  pm: PackageManagerId,
  script: string,
): { file: string; args: string[] } {
  return { file: pm, args: ['run', script] };
}
