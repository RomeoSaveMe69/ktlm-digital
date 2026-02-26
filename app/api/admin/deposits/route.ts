import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/admin/deposits?status=pending – list deposit requests for admin. */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";

    await connectDB();
    const query: Record<string, unknown> = {};
    if (["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const requests = await DepositRequest.find(query)
      .populate("userId", "email fullName")
      .populate("paymentMethodId", "methodName type")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      deposits: requests.map((r) => ({
        id: r._id.toString(),
        userId:
          (r.userId as { _id?: { toString(): string } })?._id?.toString?.() ??
          r.userId?.toString() ??
          "",
        userEmail: (r.userId as { email?: string })?.email ?? "",
        userFullName: (r.userId as { fullName?: string })?.fullName ?? "",
        amount: r.amount,
        transactionId: r.transactionId,
        screenshot: r.screenshot ?? null,
        status: r.status,
        methodName:
          (r.paymentMethodId as { methodName?: string })?.methodName ?? "",
        methodType:
          (r.paymentMethodId as { type?: string })?.type ?? "",
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("Admin deposits list error:", err);
    return apiError("Failed to load deposit requests.", 500);
  }
}
