import { execa } from 'execa';

export interface RunOptions {
  cwd: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface RunResult {
  exitCode: number | undefined;
  stdout: string;
  stderr: string;
  failed: boolean;
  /** Short, human-readable failure reason when `failed` is true. */
  message: string;
  cancelled: boolean;
}

/**
 * Runs external programs. Implementations must never use a shell: arguments are
 * passed as an array so user input cannot be interpreted as shell syntax.
 */
export interface ProcessRunner {
  run(file: string, args: readonly string[], options: RunOptions): Promise<RunResult>;
}

export const execaRunner: ProcessRunner = {
  async run(file, args, { cwd, timeoutMs, signal }) {
    const result = await execa(file, args, {
      cwd,
      reject: false,
      stdin: 'ignore',
      windowsHide: true,
      ...(timeoutMs === undefined ? {} : { timeout: timeoutMs }),
      ...(signal === undefined ? {} : { cancelSignal: signal }),
    });
    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      failed: result.failed,
      message: result.failed ? (result.shortMessage ?? 'command failed') : '',
      cancelled: result.isCanceled,
    };
  },
};
