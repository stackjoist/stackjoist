import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ASSETS_ROOT, listFiles } from '../core/assets.js';
import type { WriteFileOp } from '../core/plan.js';

/** `assets/templates`, resolved the same way from `src/recipes` and from `dist/recipes`. */
export const TEMPLATES_ROOT = path.join(ASSETS_ROOT, 'templates');

/**
 * npm never packs files named `.gitignore`, so templates store them under a
 * different name and the loader restores the real one.
 */
const RENAMES: Readonly<Record<string, string>> = { _gitignore: '.gitignore' };

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

export interface TemplateOptions {
  /** Files (template-relative, "/" separated) whose `{{key}}` placeholders are substituted. */
  substitute: readonly string[];
  values: Readonly<Record<string, string>>;
}

function substitute(file: string, text: string, values: TemplateOptions['values']): string {
  return text.replace(PLACEHOLDER, (match, key: string) => {
    const value = values[key];
    if (value === undefined) {
      throw new Error(`Template ${file} uses unknown placeholder ${match}`);
    }
    return value;
  });
}

/** Turns a template directory into write operations, in a stable order. */
export async function templateOps(
  templateId: string,
  options: TemplateOptions,
): Promise<WriteFileOp[]> {
  const root = path.join(TEMPLATES_ROOT, templateId);
  const files = await listFiles(root);
  const missing = options.substitute.filter((file) => !files.includes(file));
  if (missing.length > 0) {
    throw new Error(`Template ${templateId} has no file(s) to substitute: ${missing.join(', ')}`);
  }
  const ops: WriteFileOp[] = [];
  for (const file of files) {
    const segments = file.split('/');
    const base = segments.pop() ?? file;
    const target = [...segments, RENAMES[base] ?? base].join('/');
    const content = options.substitute.includes(file)
      ? substitute(file, await readFile(path.join(root, file), 'utf8'), options.values)
      : await readFile(path.join(root, file));
    ops.push({ kind: 'write', path: target, content });
  }
  return ops;
}
