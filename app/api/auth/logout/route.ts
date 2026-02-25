import { NextResponse } from "next/server";
import { deleteSessionCookie } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";

/**
 * POST /api/auth/logout – clear session cookie and log the user out.
 */
export async function POST() {
  try {
    await deleteSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Logout error:", err);
    return apiError("Failed to sign out.", 500);
  }
}
