import type { AddressInfo } from 'node:net';
import { createApp } from './app.js';
import type { Env } from './config/env.js';
import { connectDatabase, disconnectDatabase, isDatabaseReady } from './db/mongoose.js';
import type { Logger } from './lib/logger.js';

export interface RunningServer {
  url: string;
  /** Stops accepting connections, drains in-flight requests, then disconnects the database. */
  close(): Promise<void>;
}

type StartConfig = Pick<
  Env,
  | 'HOST'
  | 'PORT'
  | 'MONGODB_URI'
  | 'MONGODB_SERVER_SELECTION_TIMEOUT_MS'
  | 'CORS_ORIGINS'
  | 'SHUTDOWN_TIMEOUT_MS'
>;

export async function startServer(config: StartConfig, logger: Logger): Promise<RunningServer> {
  // Connect first: a server that cannot reach its database should fail fast, not serve errors.
  await connectDatabase({
    uri: config.MONGODB_URI,
    serverSelectionTimeoutMS: config.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
  });

  const app = createApp({ logger, corsOrigins: config.CORS_ORIGINS, isDatabaseReady });

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const s = app.listen(config.PORT, config.HOST, (error?: Error) => {
      if (error) reject(error);
      else resolve(s);
    });
  }).catch(async (error: unknown) => {
    await disconnectDatabase();
    throw error;
  });

  const { port } = server.address() as AddressInfo;

  return {
    url: `http://${config.HOST === '0.0.0.0' ? '127.0.0.1' : config.HOST}:${port}`,
    async close() {
      const closed = new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      server.closeIdleConnections();
      // Requests still running after the timeout are cut off so shutdown always finishes.
      const timer = setTimeout(() => {
        server.closeAllConnections();
      }, config.SHUTDOWN_TIMEOUT_MS);
      timer.unref();
      try {
        await closed;
      } finally {
        clearTimeout(timer);
        await disconnectDatabase();
      }
    },
  };
}
