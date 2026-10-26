import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The package's `assets/` folder, resolved the same way from `src/core` and `dist/core`. */
export const ASSETS_ROOT = fileURLToPath(new URL('../../assets/', import.meta.url));

/** Lists files under `dir` recursively as "/"-separated relative paths, in a stable order. */
export async function listFiles(dir: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listFiles(path.join(dir, entry.name), relative)));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}
