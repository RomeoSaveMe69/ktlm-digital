import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/me/balance – returns the current logged-in user's balance.
 * Used by client components to refresh balance without a full page reload.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const user = await User.findById(session.userId).select("balance").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ balance: user.balance ?? 0 });
  } catch (err) {
    console.error("me/balance error:", err);
    return apiError("Failed to fetch balance.", 500);
  }
}
