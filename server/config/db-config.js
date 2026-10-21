import mongoose from "mongoose";
import { env } from "./env.js";

let memoryServer = null;

/**
 * Connects to MONGODB_URL when set. Otherwise (dev/test only) starts an
 * in-memory MongoDB via mongodb-memory-server so the app runs with zero setup.
 * Returns { uri, inMemory }.
 */
export async function connectDb({ memoryPort } = {}) {
  let uri = env.mongoUrl;
  let inMemory = false;

  if (!uri) {
    if (env.isProduction) throw new Error("MONGODB_URL must be set in production.");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const port = memoryPort ?? (Number(process.env.MONGO_MEMORY_PORT) || undefined);
    memoryServer = await MongoMemoryServer.create(port ? { instance: { port } } : undefined);
    uri = memoryServer.getUri("captain_funds");
    inMemory = true;
  }

  await mongoose.connect(uri);
  return { uri, inMemory };
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
