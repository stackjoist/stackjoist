import type { ProcessRunner } from '../core/exec.js';
import type { CheckStatus } from '../core/output.js';
import { runScriptCommand, type PackageManagerId } from '../core/pm.js';
import type { VerifyStep } from '../recipes/types.js';

export interface VerifyResult {
  name: string;
  status: CheckStatus;
  command: string;
  durationMs: number;
  /** Tail of the output, for failures. */
  output?: string;
}

const OUTPUT_TAIL = 4000;

/**
 * Runs each verify step in order. After the first failure the remaining steps are
 * reported as NOT RUN rather than silently skipped.
 */
export async function runVerify(
  steps: readonly VerifyStep[],
  options: {
    cwd: string;
    packageManager: PackageManagerId;
    runner: ProcessRunner;
    timeoutMs?: number;
    signal?: AbortSignal;
  },
): Promise<VerifyResult[]> {
  const results: VerifyResult[] = [];
  let failed = false;
  for (const step of steps) {
    const { file, args } = runScriptCommand(options.packageManager, step.script);
    const command = [file, ...args].join(' ');
    if (failed) {
      results.push({ name: step.name, status: 'NOT RUN', command, durationMs: 0 });
      continue;
    }
    const started = Date.now();
    const result = await options.runner.run(file, args, {
      cwd: options.cwd,
      ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    });
    const durationMs = Date.now() - started;
    if (result.failed) {
      failed = true;
      results.push({
        name: step.name,
        status: 'FAIL',
        command,
        durationMs,
        output: `${result.stdout}\n${result.stderr}`.trim().slice(-OUTPUT_TAIL),
      });
    } else {
      results.push({ name: step.name, status: 'PASS', command, durationMs });
    }
  }
  return results;
}
