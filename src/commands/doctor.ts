import { PreconditionError } from '../core/errors.js';
import type { CheckStatus } from '../core/output.js';
import { detectFromLockfiles, isSupported } from '../core/pm.js';
import type { CommandContext } from './context.js';

export const MIN_NODE_VERSION = '22.12.0';

interface DoctorCheck {
  name: string;
  status: CheckStatus;
  required: boolean;
  detail: string;
}

/** Compares dotted numeric versions; ignores pre-release suffixes. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.replace(/^v/, '').split('-')[0]?.split('.').map(Number) ?? [];
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function toolVersion(ctx: CommandContext, file: string): Promise<string | undefined> {
  const result = await ctx.runner.run(file, ['--version'], { cwd: ctx.cwd, timeoutMs: 30_000 });
  return result.failed ? undefined : result.stdout.trim().split('\n')[0];
}

export async function runDoctor(
  ctx: CommandContext,
  nodeVersion = process.versions.node,
): Promise<void> {
  const checks: DoctorCheck[] = [];
  const nodeOk = compareVersions(nodeVersion, MIN_NODE_VERSION) >= 0;
  checks.push({
    name: 'node',
    status: nodeOk ? 'PASS' : 'FAIL',
    required: true,
    detail: nodeOk ? nodeVersion : `${nodeVersion} (requires >= ${MIN_NODE_VERSION})`,
  });

  for (const tool of ['npm', 'pnpm', 'git'] as const) {
    const version = await toolVersion(ctx, tool);
    checks.push({
      name: tool,
      status: version ? 'PASS' : 'FAIL',
      required: false,
      detail: version ?? 'not found',
    });
  }

  const hasPm = checks.some((c) => (c.name === 'npm' || c.name === 'pnpm') && c.status === 'PASS');
  checks.push({
    name: 'package manager',
    status: hasPm ? 'PASS' : 'FAIL',
    required: true,
    detail: hasPm ? 'npm or pnpm available' : 'install npm or pnpm',
  });

  const lockfiles = await detectFromLockfiles(ctx.cwd);
  const notes: string[] = [];
  if (lockfiles.length > 1)
    notes.push(`Multiple lockfiles in this directory: ${lockfiles.join(', ')}.`);
  for (const pm of lockfiles.filter((p) => !isSupported(p))) {
    notes.push(`This directory uses ${pm}, which StackJoist does not support yet.`);
  }

  const ok = checks.every((c) => !c.required || c.status === 'PASS');
  ctx.output.info(
    [
      ...checks.map(
        (c) =>
          `${c.status.padEnd(7)} ${c.name.padEnd(16)} ${c.detail}${c.required ? '' : ' (optional)'}`,
      ),
      ...notes.map((n) => `NOTE    ${n}`),
    ].join('\n'),
  );
  ctx.output.result({ ok, checks, project: { lockfiles }, notes });
  if (!ok) {
    throw new PreconditionError(
      'Required checks failed.',
      'Fix the FAIL items marked as required above.',
    );
  }
}
