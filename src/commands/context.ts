import type { ProcessRunner } from '../core/exec.js';
import type { Output } from '../core/output.js';
import type { Prompter } from '../core/prompter.js';

/** Everything a command needs from the outside world, injected so commands are testable. */
export interface CommandContext {
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  output: Output;
  runner: ProcessRunner;
  /** Undefined when prompts are not possible (no TTY, --json or --yes). */
  prompter: Prompter | undefined;
  signal: AbortSignal;
  debug: boolean;
}
