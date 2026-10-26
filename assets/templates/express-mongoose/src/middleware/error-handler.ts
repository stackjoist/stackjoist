import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';
import type { Logger } from '../lib/logger.js';

export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorBody = {
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  };
  res.status(404).json(body);
};

/** Errors thrown by body-parser carry a status and `expose: true` when safe to show. */
function isExposableClientError(err: unknown): err is { status: number; message: string } {
  if (typeof err !== 'object' || err === null) return false;
  const { status, expose } = err as { status?: unknown; expose?: unknown };
  return typeof status === 'number' && status >= 400 && status < 500 && expose === true;
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err: unknown, _req, res, _next) => {
    if (err instanceof HttpError) {
      const body: ErrorBody = {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details === undefined ? {} : { details: err.details }),
        },
      };
      res.status(err.status).json(body);
      return;
    }
    if (isExposableClientError(err)) {
      const body: ErrorBody = {
        error: {
          code: err.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
          message: err.message,
        },
      };
      res.status(err.status).json(body);
      return;
    }
    // Unknown errors are bugs or infrastructure failures: log them, never leak details.
    logger.error({ err }, 'Unhandled error');
    const body: ErrorBody = { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
    res.status(500).json(body);
  };
}
