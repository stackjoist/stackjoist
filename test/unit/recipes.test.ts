import { describe, expect, it } from 'vitest';
import type { WriteFileOp } from '../../src/core/plan.js';
import { templateOps } from '../../src/recipes/assets.js';
import { databaseName, expressMongoose } from '../../src/recipes/express-mongoose/recipe.js';
import { recipes } from '../../src/recipes/registry.js';

function writes(ops: { kind: string }[]): WriteFileOp[] {
  return ops.filter((op): op is WriteFileOp => op.kind === 'write');
}

function text(op: WriteFileOp | undefined): string {
  if (!op) throw new Error('missing file');
  return typeof op.content === 'string' ? op.content : Buffer.from(op.content).toString('utf8');
}

describe('registry', () => {
  it('has unique ids and at least one verify step per recipe', () => {
    const ids = recipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const recipe of recipes) expect(recipe.verify.length).toBeGreaterThan(0);
  });
});

describe('templateOps', () => {
  it('restores .gitignore, which npm would otherwise drop from the package', async () => {
    const paths = (await templateOps('express-mongoose', { substitute: [], values: {} })).map(
      (op) => op.path,
    );
    expect(paths).toContain('.gitignore');
    expect(paths).not.toContain('_gitignore');
  });

  it('fails on unknown placeholders instead of shipping them', async () => {
    await expect(
      templateOps('express-mongoose', { substitute: ['README.md'], values: {} }),
    ).rejects.toThrow(/unknown placeholder \{\{projectName\}\}/);
  });

  it('fails when a file to substitute does not exist', async () => {
    await expect(
      templateOps('express-mongoose', { substitute: ['nope.md'], values: {} }),
    ).rejects.toThrow(/nope\.md/);
  });
});

describe('express-mongoose recipe', () => {
  it('generates a complete project for npm', async () => {
    const ops = writes(
      (await expressMongoose.plan({ projectName: 'my.api', packageManager: 'npm' })).ops,
    );
    const paths = ops.map((op) => op.path);
    for (const expected of [
      'package.json',
      '.gitignore',
      '.env.example',
      'docker-compose.yml',
      'src/server.ts',
      'src/app.ts',
      'test/integration/notes.test.ts',
    ]) {
      expect(paths).toContain(expected);
    }
    expect(paths).not.toContain('.env');
    expect(paths).not.toContain('pnpm-workspace.yaml');

    const manifest = JSON.parse(text(ops.find((op) => op.path === 'package.json'))) as {
      name: string;
      type: string;
      scripts: Record<string, string>;
    };
    expect(manifest.name).toBe('my.api');
    expect(manifest.type).toBe('module');
    for (const step of expressMongoose.verify) expect(manifest.scripts).toHaveProperty(step.script);

    expect(text(ops.find((op) => op.path === '.env.example'))).toContain(
      'MONGODB_URI=mongodb://127.0.0.1:27017/my_api',
    );
    for (const op of ops.filter((o) => typeof o.content === 'string')) {
      expect(text(op), op.path).not.toMatch(/\{\{\w+\}\}/);
    }
  });

  it('adds a pnpm build-script policy only for pnpm', async () => {
    const ops = writes(
      (await expressMongoose.plan({ projectName: 'app', packageManager: 'pnpm' })).ops,
    );
    const policy = text(ops.find((op) => op.path === 'pnpm-workspace.yaml'));
    expect(policy).toContain('allowBuilds:');
    expect(policy).not.toContain(': true');
  });

  it.each([
    ['my-app', 'my-app'],
    ['my.app', 'my_app'],
    ['app_1', 'app_1'],
  ])('database name for %s is %s', (project, db) => {
    expect(databaseName(project)).toBe(db);
  });
});
