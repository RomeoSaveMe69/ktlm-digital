/**
 * Central configuration for the application.
 * All environment-dependent values (DB, secrets, domain, etc.) MUST be read from here.
 * Never hardcode MongoDB URI, API keys, or domain names in other files.
 *
 * Required env vars: see .env.example
 */

const env: NodeJS.ProcessEnv =
  typeof process !== "undefined" ? process.env : ({} as NodeJS.ProcessEnv);

/**
 * MongoDB connection string. Required for database operations.
 * @returns MONGODB_URI from env; empty string if unset (will cause connection to fail)
 */
export function getMongoUri(): string {
  const uri = env.MONGODB_URI ?? env["MONGODB_URI"] ?? "";
  return typeof uri === "string" ? uri.trim() : "";
}

/**
 * JWT secret for signing and verifying session tokens.
 * Must be set in production; falls back to a default only in development.
 * @returns Uint8Array for use with jose (SignJWT / jwtVerify)
 */
export function getJwtSecret(): Uint8Array {
  const raw = env.JWT_SECRET ?? env["JWT_SECRET"] ?? "";
  const secret = typeof raw === "string" ? raw.trim() : "";
  if (!secret) {
    if (getNodeEnv() === "production") {
      console.warn(
        "[KTLM] JWT_SECRET is empty in production. Set JWT_SECRET in .env or hosting env.",
      );
    }
    return new TextEncoder().encode("ktlm-default-change-in-production");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Base path for the app when deployed under a subpath (e.g. /myapp).
 * Set NEXT_PUBLIC_BASE_PATH in env.
 */
export function getBasePath(): string {
  const base = env.NEXT_PUBLIC_BASE_PATH ?? "";
  return typeof base === "string" ? base.trim() : "";
}

/**
 * Whether the app is running in production.
 */
export function isProduction(): boolean {
  return getNodeEnv() === "production";
}

/**
 * NODE_ENV (development | production | test).
 */
export function getNodeEnv(): string {
  return env.NODE_ENV ?? "development";
}

/** Session cookie name (used by auth and middleware). */
export const SESSION_COOKIE_NAME = "ktlm_session";
