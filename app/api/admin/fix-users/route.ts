import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { getNextBid, getNextSid } from "@/lib/models/Counter";
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

    let fixedBidCount = 0;
    for (const user of usersWithoutBid) {
      const bid = await getNextBid();
      await User.findByIdAndUpdate(user._id, { $set: { bid } });
      fixedBidCount++;
    }

    const sellersWithoutSid = await User.find({
      role: { $in: ["seller", "admin"] },
      $or: [{ sid: null }, { sid: "" }, { sid: { $exists: false } }],
    })
      .select("_id")
      .lean();

    let fixedSidCount = 0;
    for (const seller of sellersWithoutSid) {
      const sid = await getNextSid();
      await User.findByIdAndUpdate(seller._id, { $set: { sid } });
      fixedSidCount++;
    }

    return NextResponse.json({
      ok: true,
      fixedBidCount,
      fixedSidCount,
      message: `${fixedBidCount} BID(s) and ${fixedSidCount} SID(s) assigned.`,
    });
  } catch (err) {
    console.error("Fix users error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
