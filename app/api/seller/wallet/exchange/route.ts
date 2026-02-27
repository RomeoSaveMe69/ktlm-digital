import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/seller/wallet/exchange
 * Transfer amount from withdrawableBalance (Total Sale Money) → balance.
 * One-way only. Uses atomic findOneAndUpdate to prevent race conditions.
 * Body: { amount: number }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return apiError("Amount must be a positive number", 400);
    }
    if (!Number.isInteger(amount)) {
      return apiError("Amount must be a whole number", 400);
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(String(session.userId)),
        withdrawableBalance: { $gte: amount },
      },
      {
        $inc: {
          withdrawableBalance: -amount,
          balance: amount,
        },
      },
      { new: true },
    );

    if (!user) {
      return apiError("Insufficient Total Sale Money balance", 400);
    }

    return NextResponse.json({
      ok: true,
      withdrawableBalance: user.withdrawableBalance,
      balance: user.balance,
    });
  } catch (err) {
    console.error("Seller exchange error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
