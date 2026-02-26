import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/admin/overview – real stats for admin dashboard. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();

    const [balanceResult, pendingResult] = await Promise.all([
      User.aggregate([
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]),
      DepositRequest.aggregate([
        { $match: { status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalUserMoney = balanceResult[0]?.total ?? 0;
    const depositingPending = pendingResult[0]?.total ?? 0;

    return NextResponse.json({ totalUserMoney, depositingPending });
  } catch (err) {
    console.error("Admin overview error:", err);
    return apiError("Failed to load overview stats.", 500);
  }
}
