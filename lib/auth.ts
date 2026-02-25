import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "ktlm_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET ?? process.env["JWT_SECRET"] ?? "";
  const secret = typeof raw === "string" ? raw.trim() : "";
  if (!secret) {
    console.warn("[KTLM] JWT_SECRET is empty. Set JWT_SECRET in .env.local or Vercel → Settings → Environment Variables.");
    return new TextEncoder().encode("ktlm-default-change-in-production");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };

/** Only allow admin role; redirect otherwise. Call in admin layout. */
export async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }
}

/** Only allow seller or admin; redirect otherwise. Call in seller layout. */
export async function requireSeller(): Promise<void> {
  const session = await getSession();
  if (!session || (session.role !== "seller" && session.role !== "admin")) {
    redirect("/profile");
  }
}
