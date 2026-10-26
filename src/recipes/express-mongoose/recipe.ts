import { templateOps } from '../assets.js';
import type { Recipe, RecipeContext } from '../types.js';

// Version ranges the generated project was verified with (see docs/COMPATIBILITY.md).
// Change them only together with a full recipe verification run.
const dependencies = {
  cors: '^2.8.6',
  express: '^5.3.0',
  helmet: '^8.3.0',
  mongoose: '^9.11.4',
  pino: '^10.4.0',
  'pino-http': '^11.0.0',
  zod: '^4.6.7',
};

const devDependencies = {
  '@eslint/js': '^10.0.1',
  '@types/cors': '^2.8.19',
  '@types/express': '^5.0.6',
  '@types/node': '^22.20.5',
  '@types/supertest': '^7.2.1',
  eslint: '^10.13.0',
  'mongodb-memory-server': '^11.3.0',
  prettier: '^3.9.10',
  supertest: '^7.3.1',
  tsx: '^4.23.15',
  typescript: '~6.0.3',
  'typescript-eslint': '^8.72.0',
  vitest: '^5.0.5',
};

// pnpm (>= 10.26) only runs dependency install scripts that are explicitly allowed, and
// pnpm 11+ fails the install for unreviewed ones. Neither script is needed here.
const PNPM_BUILD_POLICY = `# Dependency install scripts reviewed by StackJoist. See https://pnpm.io/settings/build
allowBuilds:
  # Only verifies its prebuilt binary; tsx works without it.
  esbuild: false
  # Would download MongoDB during install; tests download it on first run instead.
  mongodb-memory-server: false
`;

/** MongoDB database names cannot contain ".", "/", "\", spaces and a few other characters. */
export function databaseName(projectName: string): string {
  return projectName.replace(/[^a-z0-9_-]/g, '_');
}

function packageJson({ projectName }: RecipeContext): string {
  const manifest = {
    name: projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    engines: { node: '>=22.13.0' },
    scripts: {
      dev: 'tsx watch src/server.ts',
      build: 'tsc -p tsconfig.build.json',
      start: 'node dist/server.js',
      typecheck: 'tsc --noEmit',
      lint: 'eslint .',
      format: 'prettier --write .',
      'format:check': 'prettier --check .',
      test: 'vitest run',
      'test:watch': 'vitest',
    },
    dependencies,
    devDependencies,
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export const expressMongoose: Recipe = {
  id: 'express-mongoose',
  title: 'Express + MongoDB (Mongoose)',
  description: 'REST API: Express 5, Mongoose 9, Zod validation, Vitest + Supertest',
  packageManagers: ['npm', 'pnpm'],
  async plan(ctx) {
    const files = await templateOps('express-mongoose', {
      substitute: ['README.md', '.env.example'],
      values: {
        projectName: ctx.projectName,
        packageManager: ctx.packageManager,
        dbName: databaseName(ctx.projectName),
      },
    });
    return {
      ops: [
        { kind: 'write', path: 'package.json', content: packageJson(ctx) },
        ...(ctx.packageManager === 'pnpm'
          ? [{ kind: 'write' as const, path: 'pnpm-workspace.yaml', content: PNPM_BUILD_POLICY }]
          : []),
        ...files,
      ],
    };
  },
  nextSteps: ({ packageManager }) => [
    'docker compose up -d      # local MongoDB (or set MONGODB_URI to your own)',
    'cp .env.example .env',
    `${packageManager} run dev`,
    `${packageManager} test`,
  ],
  verify: [
    { name: 'typecheck', script: 'typecheck' },
    { name: 'lint', script: 'lint' },
    { name: 'format', script: 'format:check' },
    { name: 'test', script: 'test' },
    { name: 'build', script: 'build' },
  ],
};
