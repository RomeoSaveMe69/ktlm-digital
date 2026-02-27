import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/seller/overview – seller dashboard stats from DB. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const sellerId = new mongoose.Types.ObjectId(String(session.userId));

    const user = await User.findById(sellerId)
      .select("balance withdrawableBalance pendingBalance withdrawPendingBalance")
      .lean();

    if (!user) return apiError("User not found", 404);

    // Count pending and processing orders
    const [pendingCount, processingCount] = await Promise.all([
      Order.countDocuments({ sellerId, status: "pending" }),
      Order.countDocuments({ sellerId, status: "processing" }),
    ]);

    // Calculate total profit from completed orders
    const profitAgg = await Order.aggregate([
      {
        $match: {
          sellerId,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalSellerReceived: {
            $sum: {
              $cond: [
                { $gt: ["$sellerReceivedAmount", 0] },
                "$sellerReceivedAmount",
                "$sellerAmount",
              ],
            },
          },
          totalFees: {
            $sum: {
              $cond: [
                { $gt: ["$feeAmount", 0] },
                "$feeAmount",
                "$platformFee",
              ],
            },
          },
        },
      },
    ]);

    const totalProfit = profitAgg.length > 0 ? profitAgg[0].totalSellerReceived : 0;

    return NextResponse.json({
      stats: {
        withdrawableBalance: user.withdrawableBalance ?? 0,
        balance: user.balance ?? 0,
        pendingBalance: user.pendingBalance ?? 0,
        pendingOrderCount: pendingCount,
        processingOrderCount: processingCount,
        withdrawPendingBalance: user.withdrawPendingBalance ?? 0,
        totalProfit,
      },
    });
  } catch (err) {
    console.error("Seller overview error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
