import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { WithdrawalRequest } from "@/lib/models/WithdrawalRequest";
import { User } from "@/lib/models/User";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/withdrawals/[id]
 * Admin approves or rejects a withdrawal request.
 * Body: { action: 'approve' | 'reject' }
 *
 * Approve: set status to 'approved', deduct withdrawPendingBalance (money leaves platform).
 * Reject: set status to 'rejected', move money back from withdrawPendingBalance → withdrawableBalance.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let dbSession: mongoose.ClientSession | null = null;
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid withdrawal id", 400);
    }

    const body = await request.json();
    const action = body.action;
    if (action !== "approve" && action !== "reject") {
      return apiError("action must be 'approve' or 'reject'", 400);
    }

    await connectDB();

    dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    const wr = await WithdrawalRequest.findById(id).session(dbSession);
    if (!wr) {
      await dbSession.abortTransaction();
      return apiError("Withdrawal request not found", 404);
    }
    if (wr.status !== "pending") {
      await dbSession.abortTransaction();
      return apiError("Only pending requests can be processed", 400);
    }

    if (action === "approve") {
      wr.status = "approved";
      await wr.save({ session: dbSession });

      // Deduct from withdrawPendingBalance (money has left the platform)
      const seller = await User.findOneAndUpdate(
        {
          _id: wr.sellerId,
          withdrawPendingBalance: { $gte: wr.amount },
        },
        { $inc: { withdrawPendingBalance: -wr.amount } },
        { new: true, session: dbSession },
      );
      if (!seller) {
        await dbSession.abortTransaction();
        return apiError("Seller balance inconsistency", 500);
      }
    } else {
      // Reject: return money to withdrawableBalance
      wr.status = "rejected";
      await wr.save({ session: dbSession });

      const seller = await User.findOneAndUpdate(
        {
          _id: wr.sellerId,
          withdrawPendingBalance: { $gte: wr.amount },
        },
        {
          $inc: {
            withdrawPendingBalance: -wr.amount,
            withdrawableBalance: wr.amount,
          },
        },
        { new: true, session: dbSession },
      );
      if (!seller) {
        await dbSession.abortTransaction();
        return apiError("Seller balance inconsistency", 500);
      }
    }

    await dbSession.commitTransaction();

    return NextResponse.json({
      ok: true,
      status: wr.status,
    });
  } catch (err) {
    if (dbSession?.inTransaction()) {
      await dbSession.abortTransaction();
    }
    console.error("Admin withdrawal PATCH error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  } finally {
    if (dbSession) dbSession.endSession();
  }
}
