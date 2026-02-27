import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { WithdrawalRequest } from "@/lib/models/WithdrawalRequest";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/seller/wallet/withdraw
 * Submit withdrawal request.
 * Atomically moves amount from withdrawableBalance → withdrawPendingBalance
 * and creates a WithdrawalRequest record.
 * Body: { amount: number, paymentMethod: string, accountName: string }
 */
export async function POST(request: Request) {
  const dbSession = await mongoose.startSession();
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const amount = Number(body.amount);
    const paymentMethod = String(body.paymentMethod ?? "").trim();
    const accountName = String(body.accountName ?? "").trim();

    if (!amount || isNaN(amount) || amount <= 0) {
      return apiError("Amount must be a positive number", 400);
    }
    if (!Number.isInteger(amount)) {
      return apiError("Amount must be a whole number", 400);
    }
    if (!paymentMethod) {
      return apiError("Payment method is required", 400);
    }
    if (!accountName) {
      return apiError("Account name is required", 400);
    }

    await connectDB();

    dbSession.startTransaction();

    const sellerId = new mongoose.Types.ObjectId(String(session.userId));

    // Atomically move from withdrawableBalance to withdrawPendingBalance
    const user = await User.findOneAndUpdate(
      {
        _id: sellerId,
        withdrawableBalance: { $gte: amount },
      },
      {
        $inc: {
          withdrawableBalance: -amount,
          withdrawPendingBalance: amount,
        },
      },
      { new: true, session: dbSession },
    );

    if (!user) {
      await dbSession.abortTransaction();
      return apiError("Insufficient Total Sale Money balance", 400);
    }

    // Create WithdrawalRequest
    await WithdrawalRequest.create(
      [
        {
          sellerId,
          amount,
          paymentMethod,
          accountName,
          status: "pending",
        },
      ],
      { session: dbSession },
    );

    await dbSession.commitTransaction();

    return NextResponse.json({
      ok: true,
      withdrawableBalance: user.withdrawableBalance,
      withdrawPendingBalance: user.withdrawPendingBalance,
    });
  } catch (err) {
    await dbSession.abortTransaction();
    console.error("Seller withdraw error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  } finally {
    dbSession.endSession();
  }
}
