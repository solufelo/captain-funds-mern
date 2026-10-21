import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { env } from "./env.js";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
    // Pin the binary cache to server/node_modules so it is found (and only
    // downloaded once) no matter which directory the server is started from.
    process.env.MONGOMS_DOWNLOAD_DIR ||= path.join(serverDir, "node_modules", ".cache", "mongodb-memory-server");
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
