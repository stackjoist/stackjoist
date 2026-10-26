import { log } from '@clack/prompts';
import { StackJoistError } from './errors.js';

export type CheckStatus = 'PASS' | 'FAIL' | 'NOT RUN' | 'BLOCKED';

/**
 * All user-facing output goes through this interface so commands can run in
 * pretty (TTY) or JSON mode, and tests can capture output without a terminal.
 */
export interface Output {
  readonly json: boolean;
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  step(message: string): void;
  /** Final machine-readable result; printed only in JSON mode. */
  result(data: unknown): void;
  error(error: unknown, debug: boolean): void;
}

function describe(error: unknown, debug: boolean): string {
  if (error instanceof StackJoistError) {
    const lines = [error.message];
    if (error.hint) lines.push(`Hint: ${error.hint}`);
    if (debug && error.stack) lines.push(error.stack);
    return lines.join('\n');
  }
  // Unexpected errors are bugs: always show the stack so they can be reported.
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

export function createPrettyOutput(): Output {
  return {
    json: false,
    info: (m) => {
      log.info(m);
    },
    success: (m) => {
      log.success(m);
    },
    warn: (m) => {
      log.warn(m);
    },
    step: (m) => {
      log.step(m);
    },
    result: () => undefined,
    error: (e, debug) => {
      log.error(describe(e, debug));
    },
  };
}

/** JSON mode: human messages go to stderr, the single result object to stdout. */
export function createJsonOutput(
  stdout: (s: string) => void = (s) => process.stdout.write(s),
  stderr: (s: string) => void = (s) => process.stderr.write(s),
): Output {
  const line = (level: string, m: string) => {
    stderr(`[${level}] ${m}\n`);
  };
  return {
    json: true,
    info: (m) => {
      line('info', m);
    },
    success: (m) => {
      line('success', m);
    },
    warn: (m) => {
      line('warn', m);
    },
    step: (m) => {
      line('step', m);
    },
    result: (data) => {
      stdout(`${JSON.stringify(data, null, 2)}\n`);
    },
    error: (e, debug) => {
      const exitCode = e instanceof StackJoistError ? e.exitCode : 1;
      stdout(`${JSON.stringify({ ok: false, error: describe(e, debug), exitCode }, null, 2)}\n`);
    },
  };
}
