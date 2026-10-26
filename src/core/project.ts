import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { PreconditionError } from './errors.js';
import { detectFromLockfiles, type KnownPackageManager } from './pm.js';

export type FrameworkId = 'express' | 'mongoose' | 'react' | 'vite' | 'next' | 'nestjs' | 'prisma';

const FRAMEWORK_PACKAGES: ReadonlyArray<[string, FrameworkId]> = [
  ['express', 'express'],
  ['mongoose', 'mongoose'],
  ['react', 'react'],
  ['vite', 'vite'],
  ['next', 'next'],
  ['@nestjs/core', 'nestjs'],
  ['prisma', 'prisma'],
  ['@prisma/client', 'prisma'],
];

export interface PackageManifest {
  name?: string;
  /** e.g. "pnpm@12.15.0" (Corepack field). */
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface ProjectInfo {
  root: string;
  manifest: PackageManifest | undefined;
  packageManagers: KnownPackageManager[];
  frameworks: FrameworkId[];
  hasGit: boolean;
}

async function exists(p: string): Promise<boolean> {
  return stat(p).then(
    () => true,
    () => false,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringMap(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value).filter((e): e is [string, string] => typeof e[1] === 'string'),
  );
}

async function readManifest(root: string): Promise<PackageManifest | undefined> {
  let text: string;
  try {
    text = await readFile(path.join(root, 'package.json'), 'utf8');
  } catch {
    return undefined;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new PreconditionError(`package.json in ${root} is not valid JSON.`);
  }
  if (!isRecord(raw)) throw new PreconditionError(`package.json in ${root} is not an object.`);
  const manifest: PackageManifest = {};
  if (typeof raw['name'] === 'string') manifest.name = raw['name'];
  if (typeof raw['packageManager'] === 'string') manifest.packageManager = raw['packageManager'];
  const scripts = stringMap(raw['scripts']);
  const dependencies = stringMap(raw['dependencies']);
  const devDependencies = stringMap(raw['devDependencies']);
  if (scripts) manifest.scripts = scripts;
  if (dependencies) manifest.dependencies = dependencies;
  if (devDependencies) manifest.devDependencies = devDependencies;
  return manifest;
}

/** Reads what an add-on needs to know about an existing project. Never writes. */
export async function inspectProject(root: string): Promise<ProjectInfo> {
  const rootStat = await stat(root).catch(() => undefined);
  if (!rootStat?.isDirectory()) throw new PreconditionError(`Not a directory: ${root}`);

  const manifest = await readManifest(root);
  const hasGit = await exists(path.join(root, '.git'));
  if (!manifest && !hasGit) {
    throw new PreconditionError(
      `${root} does not look like a project (no package.json and no .git).`,
      'Run this inside your project root, or pass --dir <path>.',
    );
  }
  const deps = { ...manifest?.dependencies, ...manifest?.devDependencies };
  const frameworks = [
    ...new Set(FRAMEWORK_PACKAGES.filter(([pkg]) => pkg in deps).map(([, id]) => id)),
  ];
  return {
    root,
    manifest,
    packageManagers: await detectFromLockfiles(root),
    frameworks,
    hasGit,
  };
}
