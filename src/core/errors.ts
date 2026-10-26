/** Stable process exit codes. Scripts and CI may depend on these values. */
export const ExitCode = {
  Success: 0,
  Failure: 1,
  Usage: 2,
  Precondition: 3,
  ExternalTool: 4,
  Cancelled: 130,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];

/** Base class for errors whose message is safe and useful to show to the user. */
export class StackJoistError extends Error {
  constructor(
    message: string,
    readonly exitCode: ExitCodeValue,
    readonly hint?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Invalid flags, arguments or prompt answers. */
export class UsageError extends StackJoistError {
  constructor(message: string, hint?: string) {
    super(message, ExitCode.Usage, hint);
  }
}

/** The environment or filesystem is not in a state we can safely work with. */
export class PreconditionError extends StackJoistError {
  constructor(message: string, hint?: string) {
    super(message, ExitCode.Precondition, hint);
  }
}

/** An external command (package manager, git, generator) failed. */
export class ExternalToolError extends StackJoistError {
  constructor(
    message: string,
    readonly command: string,
    readonly output: string,
    hint?: string,
  ) {
    super(message, ExitCode.ExternalTool, hint);
  }
}

export class CancelledError extends StackJoistError {
  constructor(message = 'Cancelled.') {
    super(message, ExitCode.Cancelled);
  }
}

export function exitCodeFor(error: unknown): ExitCodeValue {
  return error instanceof StackJoistError ? error.exitCode : ExitCode.Failure;
}
