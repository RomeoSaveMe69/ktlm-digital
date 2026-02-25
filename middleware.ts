import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "ktlm_session";

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET ?? "";
  const secret = typeof raw === "string" ? raw.trim() : "";
  if (!secret) {
    return new TextEncoder().encode("ktlm-default-change-in-production");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const role = payload.role as string;
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path.startsWith("/seller") && !path.startsWith("/seller/apply")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const role = payload.role as string;
      if (role !== "seller" && role !== "admin") {
        return NextResponse.redirect(new URL("/profile", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/seller", "/seller/:path*"],
};
