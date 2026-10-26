import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isDatabaseReady } from '../../src/db/mongoose.js';
import { createLogger } from '../../src/lib/logger.js';
import { startServer } from '../../src/start.js';

const logger = createLogger('silent');
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
});

afterAll(async () => {
  await mongo.stop();
});

const baseConfig = {
  HOST: '127.0.0.1',
  PORT: 0,
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: 2000,
  CORS_ORIGINS: [],
  SHUTDOWN_TIMEOUT_MS: 2000,
};

describe('startServer', () => {
  it('serves requests and shuts down cleanly', async () => {
    const server = await startServer({ ...baseConfig, MONGODB_URI: mongo.getUri() }, logger);
    const res = await fetch(`${server.url}/health/ready`);
    expect(res.status).toBe(200);

    await server.close();
    expect(isDatabaseReady()).toBe(false);
    await expect(fetch(`${server.url}/health`)).rejects.toThrow();
  });

  it('fails fast when the database is unreachable', async () => {
    await expect(
      startServer(
        {
          ...baseConfig,
          MONGODB_URI: 'mongodb://127.0.0.1:1/unreachable',
          MONGODB_SERVER_SELECTION_TIMEOUT_MS: 500,
        },
        logger,
      ),
    ).rejects.toThrow();
  });
});
