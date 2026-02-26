import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { User } from "@/lib/models/User";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/deposits/[id] – approve or reject a deposit request.
 * Body: { action: 'approve' | 'reject' }
 *
 * Approve logic:
 *   1. Set deposit status → 'approved'
 *   2. Increment user.balance by deposit.amount
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid deposit id." }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action === "approve" ? "approve" : "reject";

    await connectDB();

    const deposit = await DepositRequest.findById(id);
    if (!deposit) {
      return NextResponse.json({ error: "Deposit request not found." }, { status: 404 });
    }
    if (deposit.status !== "pending") {
      return NextResponse.json(
        { error: `Request is already ${deposit.status}.` },
        { status: 400 },
      );
    }

    if (action === "approve") {
      // Atomically increment user balance
      const userUpdate = await User.findByIdAndUpdate(
        deposit.userId,
        { $inc: { balance: deposit.amount } },
        { new: true },
      );
      if (!userUpdate) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      deposit.status = "approved";
    } else {
      deposit.status = "rejected";
    }

    await deposit.save();

    return NextResponse.json({
      ok: true,
      status: deposit.status,
    });
  } catch (err) {
    console.error("Admin deposit action error:", err);
    return apiError("Failed to process deposit request.", 500);
  }
}
