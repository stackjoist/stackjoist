import mongoose from 'mongoose';

export interface DatabaseOptions {
  uri: string;
  serverSelectionTimeoutMS: number;
}

export async function connectDatabase({ uri, serverSelectionTimeoutMS }: DatabaseOptions) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
