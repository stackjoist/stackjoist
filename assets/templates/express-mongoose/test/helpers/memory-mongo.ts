import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

/**
 * Starts a throwaway in-memory MongoDB for the current test file and connects Mongoose to it.
 * Tests never read MONGODB_URI, so they cannot reach a real (or production) database.
 */
export function useMemoryMongo() {
  let server: MongoMemoryServer | undefined;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
  });

  afterEach(async () => {
    await Promise.all(
      Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await server?.stop();
  });
}
