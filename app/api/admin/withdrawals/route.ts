import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { WithdrawalRequest } from "@/lib/models/WithdrawalRequest";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/** GET /api/admin/withdrawals – list all withdrawal requests. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();

    const requests = await WithdrawalRequest.find()
      .populate("sellerId", "email fullName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      withdrawals: requests.map((r) => ({
        _id: r._id.toString(),
        sellerEmail: (r.sellerId as { email?: string })?.email ?? "Unknown",
        sellerName: (r.sellerId as { fullName?: string })?.fullName ?? "",
        amount: r.amount,
        paymentMethod: r.paymentMethod,
        accountName: r.accountName,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Admin withdrawals GET error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
