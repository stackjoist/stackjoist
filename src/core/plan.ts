import { CancelledError, ExternalToolError } from './errors.js';
import type { ProcessRunner } from './exec.js';
import { resolveInside, writeFileInside } from './fs-safe.js';

/** Creates a new file; never overwrites. `path` is relative to the project root, using "/". */
export interface WriteFileOp {
  kind: 'write';
  path: string;
  content: string | Uint8Array;
}

/** Runs a program inside the project root (or a subdirectory of it). */
export interface RunCommandOp {
  kind: 'run';
  label: string;
  file: string;
  args: readonly string[];
  cwd?: string;
  timeoutMs?: number;
}

export type PlanOp = WriteFileOp | RunCommandOp;

/** Ordered list of side effects. Building a plan must not touch the filesystem. */
export interface Plan {
  ops: PlanOp[];
}

export function describePlan(plan: Plan): string[] {
  return plan.ops.map((op) =>
    op.kind === 'write' ? `create  ${op.path}` : `run     ${[op.file, ...op.args].join(' ')}`,
  );
}

export interface ExecuteOptions {
  root: string;
  runner: ProcessRunner;
  signal?: AbortSignal;
  onStep?: (description: string) => void;
}

export async function executePlan(plan: Plan, options: ExecuteOptions): Promise<void> {
  const { root, runner, signal, onStep } = options;
  for (const op of plan.ops) {
    if (signal?.aborted) throw new CancelledError();
    if (op.kind === 'write') {
      await writeFileInside(root, op.path, op.content);
      continue;
    }
    onStep?.(op.label);
    const cwd = op.cwd === undefined ? root : await resolveInside(root, op.cwd);
    const result = await runner.run(op.file, op.args, {
      cwd,
      ...(op.timeoutMs === undefined ? {} : { timeoutMs: op.timeoutMs }),
      ...(signal === undefined ? {} : { signal }),
    });
    if (result.cancelled) throw new CancelledError();
    if (result.failed) {
      throw new ExternalToolError(
        `${op.label} failed: ${result.message}`,
        [op.file, ...op.args].join(' '),
        `${result.stdout}\n${result.stderr}`.trim(),
      );
    }
  }
}
