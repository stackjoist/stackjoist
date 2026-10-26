import { describe, expect, it } from 'vitest';
import { ciGithub, renderWorkflow } from '../../src/addons/ci-github/addon.js';
import type { AddonContext } from '../../src/addons/types.js';
import type { KnownPackageManager } from '../../src/core/pm.js';
import type { PackageManifest } from '../../src/core/project.js';

function ctx(
  packageManagers: KnownPackageManager[],
  manifest: PackageManifest | null = { scripts: { lint: 'eslint .', test: 'vitest' } },
  pnpmVersion?: string,
): AddonContext {
  return {
    project: {
      root: '/p',
      manifest: manifest ?? undefined,
      packageManagers,
      frameworks: [],
      hasGit: true,
    },
    pnpmVersion,
  };
}

describe('ci-github', () => {
  it('runs only the scripts the project has, in a fixed order, with npm ci', () => {
    const yml = renderWorkflow(
      ctx(['npm'], { scripts: { test: 'x', build: 'x', typecheck: 'x', dev: 'x' } }),
    );
    const runs = yml.split('\n').filter((l) => l.trim().startsWith('- run:'));
    expect(runs.map((l) => l.trim())).toEqual([
      '- run: npm ci',
      '- run: npm run typecheck',
      '- run: npm run test',
      '- run: npm run build',
    ]);
    expect(yml).not.toContain('pnpm');
  });

  it('uses least privilege and SHA-pinned actions', () => {
    const yml = renderWorkflow(ctx(['npm']));
    expect(yml).toContain('permissions:\n  contents: read');
    expect(yml).toContain('persist-credentials: false');
    for (const line of yml.split('\n').filter((l) => l.includes('uses:'))) {
      expect(line).toMatch(/@[0-9a-f]{40} # v\d/);
    }
  });

  it('uses the packageManager field when present instead of a pinned pnpm version', () => {
    const yml = renderWorkflow(
      ctx(['pnpm'], { packageManager: 'pnpm@12.15.0', scripts: { test: 'x' } }, '11.0.0'),
    );
    expect(yml).not.toMatch(/^\s+version:/m);
    expect(yml).toContain('cache: pnpm');
  });

  it.each([
    [ctx(['npm'], null), /no package.json/],
    [ctx([]), /no lockfile/],
    [ctx(['npm', 'pnpm']), /several lockfiles/],
    [ctx(['yarn']), /not supported/],
    [ctx(['pnpm']), /pnpm version unknown/],
    [ctx(['npm'], { scripts: { dev: 'x' } }), /none of the scripts/],
  ])('reports incompatibility %#', (context, reason) => {
    expect(ciGithub.incompatibility(context)).toMatch(reason);
  });
});
