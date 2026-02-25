import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret, SESSION_COOKIE_NAME } from "@/lib/config";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const role = payload.role as string;
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path.startsWith("/seller") && !path.startsWith("/seller/apply")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
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
