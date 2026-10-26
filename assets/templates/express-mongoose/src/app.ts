import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { notesRouter } from './modules/notes/note.routes.js';

export interface AppOptions {
  logger: Logger;
  corsOrigins: string[];
  isDatabaseReady: () => boolean;
}

/** Builds the Express app without starting a server, so tests can call it directly. */
export function createApp({ logger, corsOrigins, isDatabaseReady }: AppOptions): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : false }));
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', healthRouter(isDatabaseReady));
  app.use('/api/notes', notesRouter());

  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
