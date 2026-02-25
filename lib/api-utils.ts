import { NextResponse } from "next/server";

/**
 * Return a consistent JSON error response for API routes.
 * Use in catch blocks so clients always receive { error: string }.
 * @param message - User-facing or safe error message
 * @param status - HTTP status (default 500)
 */
export function apiError(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Map common DB/network errors to user-friendly messages.
 * Use after catching in API routes before returning apiError().
 */
export function normalizeErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    message.includes("Authentication failed") ||
    message.includes("bad auth") ||
    message.includes("auth failed")
  ) {
    return "Database authentication failed. Check credentials.";
  }
  if (
    message.includes("connect") ||
    message.includes("MongoNetworkError") ||
    message.includes("MongoServerError")
  ) {
    return "Database connection failed. Check MongoDB URI and network access.";
  }
  if (message.includes("E11000") || message.includes("duplicate key")) {
    return "An account with this email already exists.";
  }
  return message.length > 200 ? "Request failed. Please try again." : message;
}
