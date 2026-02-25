import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached = global.mongoose ?? { conn: null, promise: null };
if (process.env.NODE_ENV !== "production") global.mongoose = cached;

const DEFAULT_PASSWORD = "LudgKBeBwrS85mev";

/**
 * Prepare MongoDB URI for connect:
 * - Trim whitespace
 * - Replace <password> placeholder with actual password
 * - Remove any query option that has no value (avoids MongoAPIError "URI option '...' cannot be specified with no value")
 * URI is passed to mongoose.connect() as-is (no encodeURIComponent) so @, :, / work correctly.
 */
function prepareMongoUri(raw: string): string {
  let uri = raw.trim();
  if (uri.includes("<password>")) {
    uri = uri.replace(/<password>/gi, DEFAULT_PASSWORD);
  }
  const qIndex = uri.indexOf("?");
  if (qIndex === -1) return uri;
  const base = uri.slice(0, qIndex);
  const query = uri.slice(qIndex + 1);
  const validParams = query
    .split("&")
    .map((part) => part.trim())
    .filter((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return false;
      const value = part.slice(eq + 1).trim();
      return value.length > 0;
    });
  if (validParams.length === 0) return base;
  return `${base}?${validParams.join("&")}`;
}

export async function connectDB(): Promise<typeof mongoose> {
  const raw = process.env.MONGODB_URI;
  if (!raw || !raw.trim()) {
    const msg = "MONGODB_URI is not set. Add it in .env.local (local) or Vercel → Settings → Environment Variables (production).";
    console.error("[KTLM] Database connection failed:", msg);
    throw new Error(msg);
  }
  const uri = prepareMongoUri(raw);
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
