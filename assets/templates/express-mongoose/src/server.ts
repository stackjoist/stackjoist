import { existsSync } from 'node:fs';
import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { startServer } from './start.js';

async function main() {
  // Real environment variables take precedence over values in .env.
  if (existsSync('.env')) process.loadEnvFile('.env');

  let env;
  try {
    env = loadEnv();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const logger = createLogger(env.LOG_LEVEL);

  let server;
  try {
    server = await startServer(env, logger);
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start');
    process.exit(1);
  }
  logger.info({ url: server.url }, 'Server listening');

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Shutting down');
    server.close().then(
      () => process.exit(0),
      (error: unknown) => {
        logger.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      },
    );
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

await main();
