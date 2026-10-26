import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { UsageError } from '../../src/core/errors.js';
import {
  assertSupported,
  detectFromLockfiles,
  detectFromUserAgent,
  installCommand,
} from '../../src/core/pm.js';
import { tempDir } from '../helpers.js';

describe('detectFromUserAgent', () => {
  it.each([
    ['pnpm/12.15.0 npm/? node/v24.18.1 win32 x64', 'pnpm'],
    ['npm/12.1.0 node/v24.18.1 win32 x64 workspaces/false', 'npm'],
    ['yarn/1.22.22 npm/? node/v24.18.1', 'yarn'],
    ['bun/1.2.0 npm/? node/v24.0.0', 'bun'],
  ])('%s -> %s', (ua, expected) => {
    expect(detectFromUserAgent(ua)).toBe(expected);
  });

  it('returns undefined for missing or unknown agents', () => {
    expect(detectFromUserAgent(undefined)).toBeUndefined();
    expect(detectFromUserAgent('')).toBeUndefined();
    expect(detectFromUserAgent('deno/2.0')).toBeUndefined();
  });
});

describe('detectFromLockfiles', () => {
  it('finds nothing in an empty directory', async () => {
    expect(await detectFromLockfiles(await tempDir())).toEqual([]);
  });

  it('reports every lockfile present', async () => {
    const dir = await tempDir();
    await writeFile(path.join(dir, 'pnpm-lock.yaml'), '');
    await writeFile(path.join(dir, 'yarn.lock'), '');
    expect(await detectFromLockfiles(dir)).toEqual(['pnpm', 'yarn']);
  });
});

describe('assertSupported', () => {
  it('accepts npm and pnpm', () => {
    expect(assertSupported('npm')).toBe('npm');
    expect(assertSupported('pnpm')).toBe('pnpm');
  });

  it.each(['yarn', 'bun', 'npm; rm -rf /'])('rejects %j with a usage error', (pm) => {
    expect(() => assertSupported(pm)).toThrow(UsageError);
  });
});

describe('installCommand', () => {
  it('uses an argument array, never a shell string', () => {
    expect(installCommand('pnpm')).toEqual({ file: 'pnpm', args: ['install'] });
  });
});
