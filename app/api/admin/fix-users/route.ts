import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { getNextBid } from "@/lib/models/Counter";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/fix-users
 * Find all users where bid is null/empty and assign a unique BID.
 * Returns the count of users fixed.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();

    const usersWithoutBid = await User.find({
      $or: [{ bid: null }, { bid: "" }, { bid: { $exists: false } }],
    })
      .select("_id")
      .lean();

    let fixedCount = 0;
    for (const user of usersWithoutBid) {
      const bid = await getNextBid();
      await User.findByIdAndUpdate(user._id, { $set: { bid } });
      fixedCount++;
    }

    return NextResponse.json({
      ok: true,
      fixedCount,
      message: `${fixedCount} user(s) have been assigned a BID.`,
    });
  } catch (err) {
    console.error("Fix users error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
