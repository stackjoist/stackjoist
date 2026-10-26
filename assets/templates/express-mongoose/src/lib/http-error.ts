import type { z } from 'zod';

/** An error that is safe to send to the client as-is. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFound(message = 'Resource not found'): HttpError {
  return new HttpError(404, 'NOT_FOUND', message);
}

/** Parses untrusted input with a Zod schema, or throws a 400 with the validation issues. */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}
