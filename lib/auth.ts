import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getJwtSecret, isProduction, SESSION_COOKIE_NAME } from "@/lib/config";

const COOKIE_NAME = SESSION_COOKIE_NAME;
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Session/JWT payload: used by getSession() and API routes to read current user role (buyer | seller | admin).
 */
export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Create a signed JWT for the given user payload. Used after login/signup.
 * @param payload - userId, email, role
 * @returns Signed JWT string
 */
export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getJwtSecret());
  return token;
}

/**
 * Verify a JWT and return the payload, or null if invalid/expired.
 */
export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current session from the cookie. Returns null if not logged in or token invalid.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Set the session cookie after login/signup. */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/** Clear the session cookie (logout). */
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };

/**
 * Ensure the current user is admin; redirect to /login otherwise. Use in admin layout.
 */
export async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }
}

/**
 * Ensure the current user is seller or admin; redirect to /profile otherwise. Use in seller layout.
 */
export async function requireSeller(): Promise<void> {
  const session = await getSession();
  if (!session || (session.role !== "seller" && session.role !== "admin")) {
    redirect("/profile");
  }
}
