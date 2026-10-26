import path from 'node:path';
import {
  CancelledError,
  ExternalToolError,
  PreconditionError,
  UsageError,
} from '../core/errors.js';
import { validateProjectName } from '../core/names.js';
import type { CheckStatus } from '../core/output.js';
import { describePlan, executePlan } from '../core/plan.js';
import {
  assertSupported,
  detectFromUserAgent,
  installCommand,
  isSupported,
  SUPPORTED_PACKAGE_MANAGERS,
  type PackageManagerId,
} from '../core/pm.js';
import { checkTarget, createStaging, resolveTarget } from '../core/fs-safe.js';
import type { Recipe, RecipeContext } from '../recipes/types.js';
import type { CommandContext } from './context.js';

export interface CreateOptions {
  name?: string;
  template?: string;
  pm?: string;
  dir?: string;
  install: boolean;
  git: boolean;
  dryRun: boolean;
}

interface StepReport {
  step: string;
  status: CheckStatus;
  detail?: string;
}

const INSTALL_TIMEOUT_MS = 15 * 60_000;

async function resolveName(options: CreateOptions, ctx: CommandContext): Promise<string> {
  let name = options.name;
  if (name === undefined) {
    if (!ctx.prompter) {
      throw new UsageError(
        'Missing project name.',
        'Pass it as the first argument: create-stackjoist my-app',
      );
    }
    name = await ctx.prompter.text({
      message: 'Project name',
      placeholder: 'my-app',
      validate: (v) => {
        const check = validateProjectName(v);
        return check.ok ? undefined : check.problems.join(' ');
      },
    });
  }
  const check = validateProjectName(name);
  if (!check.ok) {
    throw new UsageError(`Invalid project name "${name}":\n- ${check.problems.join('\n- ')}`);
  }
  return name;
}

async function resolveRecipe(
  options: CreateOptions,
  ctx: CommandContext,
  registry: readonly Recipe[],
): Promise<Recipe> {
  if (registry.length === 0) {
    throw new PreconditionError(
      'No project recipes are available in this version yet.',
      'Run "stackjoist list" to see what this version provides.',
    );
  }
  let id = options.template;
  if (id === undefined) {
    if (!ctx.prompter) {
      throw new UsageError(
        'Missing --template.',
        `Available templates: ${registry.map((r) => r.id).join(', ')}`,
      );
    }
    id = await ctx.prompter.select({
      message: 'Template',
      choices: registry.map((r) => ({ value: r.id, label: r.title, hint: r.description })),
    });
  }
  const recipe = registry.find((r) => r.id === id);
  if (!recipe) {
    throw new UsageError(
      `Unknown template "${id}".`,
      `Available templates: ${registry.map((r) => r.id).join(', ')}`,
    );
  }
  return recipe;
}

async function resolvePackageManager(
  options: CreateOptions,
  ctx: CommandContext,
  recipe: Recipe,
): Promise<PackageManagerId> {
  let pm: PackageManagerId;
  if (options.pm !== undefined) {
    pm = assertSupported(options.pm);
  } else {
    const detected = detectFromUserAgent(ctx.env['npm_config_user_agent']);
    if (detected !== undefined && !isSupported(detected)) {
      throw new UsageError(
        `This command was started with ${detected}, which is not supported in this version.`,
        `Re-run with --pm ${SUPPORTED_PACKAGE_MANAGERS.join(' or --pm ')}.`,
      );
    }
    if (detected !== undefined) {
      pm = detected;
    } else if (ctx.prompter) {
      pm = await ctx.prompter.select({
        message: 'Package manager',
        choices: SUPPORTED_PACKAGE_MANAGERS.map((p) => ({ value: p, label: p })),
        initial: 'npm',
      });
    } else {
      pm = 'npm';
    }
  }
  if (!recipe.packageManagers.includes(pm)) {
    throw new UsageError(
      `Template "${recipe.id}" does not support ${pm}.`,
      `Supported: ${recipe.packageManagers.join(', ')}`,
    );
  }
  return pm;
}

async function initGit(target: string, ctx: CommandContext): Promise<StepReport> {
  const inside = await ctx.runner.run('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd: target,
  });
  if (!inside.failed && inside.stdout.trim() === 'true') {
    return { step: 'git init', status: 'NOT RUN', detail: 'already inside a git repository' };
  }
  const result = await ctx.runner.run('git', ['init'], { cwd: target });
  if (result.failed) {
    return { step: 'git init', status: 'BLOCKED', detail: result.message };
  }
  return { step: 'git init', status: 'PASS' };
}

export async function runCreate(
  options: CreateOptions,
  ctx: CommandContext,
  registry: readonly Recipe[],
): Promise<void> {
  const { output } = ctx;
  const projectName = await resolveName(options, ctx);
  const recipe = await resolveRecipe(options, ctx, registry);
  const packageManager = await resolvePackageManager(options, ctx, recipe);
  const target = resolveTarget(ctx.cwd, projectName, options.dir);
  await checkTarget(target);

  const recipeCtx: RecipeContext = { projectName, packageManager };
  const plan = recipe.plan(recipeCtx);
  const install = installCommand(packageManager);

  if (options.dryRun) {
    const planned = [
      ...describePlan(plan),
      ...(options.install ? [`run     ${[install.file, ...install.args].join(' ')}`] : []),
      ...(options.git ? ['run     git init'] : []),
    ];
    output.info(`Dry run: nothing was written.\nTarget: ${target}\n${planned.join('\n')}`);
    output.result({
      ok: true,
      dryRun: true,
      target,
      template: recipe.id,
      packageManager,
      plan: planned,
    });
    return;
  }

  const steps: StepReport[] = [];
  const staging = await createStaging(target);
  try {
    output.step(`Generating ${recipe.title} in ${target}`);
    await executePlan(plan, {
      root: staging.dir,
      runner: ctx.runner,
      signal: ctx.signal,
      onStep: (s) => {
        output.step(s);
      },
    });
    await staging.finalize();
    steps.push({ step: 'generate', status: 'PASS' });
  } catch (error) {
    await staging.discard();
    throw error;
  }

  // Install runs after finalize: pnpm links can contain absolute paths, which a
  // later rename would break. A failed install leaves the generated files in place.
  if (options.install) {
    output.step(`Installing dependencies with ${packageManager}`);
    const result = await ctx.runner.run(install.file, install.args, {
      cwd: target,
      timeoutMs: INSTALL_TIMEOUT_MS,
      signal: ctx.signal,
    });
    if (result.cancelled) {
      throw new CancelledError(`Installation cancelled. The project files remain in ${target}.`);
    }
    if (result.failed) {
      throw new ExternalToolError(
        `Dependency installation failed: ${result.message}`,
        [install.file, ...install.args].join(' '),
        `${result.stdout}\n${result.stderr}`.trim(),
        `The project files were created in ${target}. Fix the problem above, then run "${packageManager} install" there.`,
      );
    }
    steps.push({ step: 'install', status: 'PASS' });
  } else {
    steps.push({ step: 'install', status: 'NOT RUN', detail: '--no-install' });
  }

  if (options.git) {
    const report = await initGit(target, ctx);
    steps.push(report);
    if (report.status === 'BLOCKED') output.warn(`git init skipped: ${report.detail ?? ''}`);
  } else {
    steps.push({ step: 'git init', status: 'NOT RUN', detail: '--no-git' });
  }

  const relative = path.relative(ctx.cwd, target) || '.';
  const nextSteps = [
    ...(relative === '.' ? [] : [`cd ${relative}`]),
    ...(options.install ? [] : [`${packageManager} install`]),
    ...recipe.nextSteps(recipeCtx),
  ];
  output.success(
    [
      `Created ${projectName} from "${recipe.id}".`,
      ...steps.map((s) => `  ${s.status.padEnd(7)} ${s.step}${s.detail ? ` (${s.detail})` : ''}`),
      'This is a starting point: run its checks before relying on it.',
      'Next steps:',
      ...nextSteps.map((s) => `  ${s}`),
    ].join('\n'),
  );
  output.result({ ok: true, target, template: recipe.id, packageManager, steps, nextSteps });
}
