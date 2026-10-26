import path from 'node:path';
import { applyAddon, hasWork, planAddon, type PlannedChange } from '../addons/engine.js';
import type { Addon, AddonCheck, AddonContext } from '../addons/types.js';
import { PreconditionError, UsageError } from '../core/errors.js';
import { inspectProject } from '../core/project.js';
import type { CommandContext } from './context.js';

export interface AddOptions {
  id: string;
  dir?: string;
  dryRun: boolean;
  yes: boolean;
}

const LABELS: Record<PlannedChange['action'], string> = {
  create: 'create',
  update: 'update',
  merge: 'merge',
  unchanged: 'ok',
  adopt: 'track',
  sidecar: 'new-copy',
  conflict: 'CONFLICT',
};

function describeChange(change: PlannedChange): string {
  const target =
    change.write && change.write.path !== change.path ? ` -> ${change.write.path}` : '';
  const reason = change.reason ? ` (${change.reason})` : '';
  return `  ${LABELS[change.action].padEnd(9)} ${change.path}${target}${reason}`;
}

async function pnpmVersion(ctx: CommandContext, root: string): Promise<string | undefined> {
  const result = await ctx.runner.run('pnpm', ['--version'], { cwd: root, timeoutMs: 30_000 });
  return result.failed ? undefined : result.stdout.trim();
}

export async function runAdd(
  options: AddOptions,
  ctx: CommandContext,
  registry: readonly Addon[],
): Promise<void> {
  const { output } = ctx;
  const addon = registry.find((a) => a.id === options.id);
  if (!addon) {
    throw new UsageError(
      `Unknown add-on "${options.id}".`,
      `Available add-ons: ${registry.map((a) => a.id).join(', ')}`,
    );
  }

  const root = path.resolve(ctx.cwd, options.dir ?? '.');
  const project = await inspectProject(root);
  const addonCtx: AddonContext = {
    project,
    pnpmVersion: project.packageManagers.includes('pnpm')
      ? await pnpmVersion(ctx, root)
      : undefined,
  };
  const incompatible = addon.incompatibility(addonCtx);
  if (incompatible) {
    throw new PreconditionError(`Cannot add "${addon.id}" here: ${incompatible}.`);
  }

  const plan = await planAddon(root, addon, await addon.changes(addonCtx));
  const conflicts = plan.changes.filter((c) => c.action === 'conflict');
  const unmergeable = conflicts.filter((c) => !c.write);
  const preview = [
    `${addon.title} (${addon.id} ${addon.version}) in ${root}`,
    ...plan.changes.map(describeChange),
  ];
  output.info(preview.join('\n'));

  const summary = {
    addon: addon.id,
    version: addon.version,
    root,
    changes: plan.changes.map(({ path: p, action, reason, write }) => ({
      path: p,
      action,
      ...(reason ? { reason } : {}),
      ...(write && write.path !== p ? { writesTo: write.path } : {}),
    })),
    limitations: addon.limitations,
  };

  if (unmergeable.length > 0) {
    output.result({ ok: false, ...summary });
    throw new PreconditionError(
      `Cannot merge into: ${unmergeable.map((c) => c.path).join(', ')}.`,
      'Fix the reported problem in those files, then run the command again.',
    );
  }
  if (options.dryRun) {
    output.result({ ok: true, dryRun: true, ...summary });
    return;
  }
  if (!hasWork(plan)) {
    output.success(`"${addon.id}" is already up to date. Nothing to do.`);
    output.result({ ok: true, upToDate: true, ...summary });
    return;
  }

  if (conflicts.length > 0) {
    const message = `${conflicts.length} existing file(s) differ from the add-on's version. They will NOT be overwritten; the new versions are written next to them as *.stackjoist-new for you to merge.`;
    if (options.yes || !ctx.prompter) {
      output.result({ ok: false, ...summary });
      throw new PreconditionError(
        message,
        'Run interactively to confirm, or move/merge those files first.',
      );
    }
    output.warn(message);
  }
  if (!options.yes) {
    if (!ctx.prompter) {
      throw new UsageError(
        'Refusing to change files without confirmation.',
        'Re-run with --yes to apply, or --dry-run to preview.',
      );
    }
    const proceed = await ctx.prompter.confirm({ message: 'Apply these changes?', initial: true });
    if (!proceed) {
      output.info('No changes made.');
      output.result({ ok: true, applied: false, ...summary });
      return;
    }
  }

  const applied = await applyAddon(root, plan);
  const checks: AddonCheck[] = await addon.verify(root);
  output.success(
    [
      `Applied "${addon.id}". Files written: ${applied.written.length}.`,
      ...(applied.backupDir ? [`Backups of replaced files: ${applied.backupDir}`] : []),
      'Checks:',
      ...checks.map((c) => `  ${c.status.padEnd(7)} ${c.name}${c.detail ? ` (${c.detail})` : ''}`),
      'Limitations:',
      ...addon.limitations.map((l) => `  - ${l}`),
      'Next steps:',
      ...addon.nextSteps.map((s) => `  ${s}`),
    ].join('\n'),
  );
  const failed = checks.some((c) => c.status === 'FAIL');
  output.result({
    ok: !failed,
    ...summary,
    written: applied.written,
    backups: applied.backups,
    checks,
  });
  if (failed) {
    throw new PreconditionError(`"${addon.id}" was applied, but some checks failed (see above).`);
  }
}
