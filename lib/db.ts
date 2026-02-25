import mongoose from "mongoose";
import { getMongoUri, getNodeEnv } from "@/lib/config";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached = global.mongoose ?? { conn: null, promise: null };
if (getNodeEnv() !== "production") global.mongoose = cached;

/**
 * Connect to MongoDB using MONGODB_URI from config.
 * Reuses a single connection in development to avoid too many connections.
 * @returns The mongoose connection
 * @throws If connection fails (e.g. invalid URI or network error)
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = getMongoUri();
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri || "");
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
