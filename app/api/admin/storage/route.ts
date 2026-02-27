import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/storage
 * Returns storage stats and list of approved/rejected deposits that still have screenshots.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();

    const deposits = await DepositRequest.find({
      status: { $in: ["approved", "rejected"] },
      screenshot: { $exists: true, $nin: [null, ""] },
    })
      .populate("userId", "email fullName")
      .sort({ updatedAt: -1 })
      .lean();

    let totalBytes = 0;
    const items = deposits.map((d) => {
      const screenshotLength = d.screenshot?.length ?? 0;
      totalBytes += screenshotLength;
      return {
        _id: d._id.toString(),
        userEmail:
          (d.userId as { email?: string })?.email ?? "Unknown",
        userName:
          (d.userId as { fullName?: string })?.fullName ?? "",
        amount: d.amount,
        status: d.status,
        screenshotSizeKB: +(screenshotLength / 1024).toFixed(1),
        transactionId: d.transactionId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });

    const totalMB = +(totalBytes / (1024 * 1024)).toFixed(2);

    return NextResponse.json({ totalMB, count: items.length, items });
  } catch (err) {
    console.error("Admin storage GET error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}

/**
 * DELETE /api/admin/storage
 * Clear screenshot from a specific deposit request.
 * Body: { depositId: string }
 */
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();
    const body = await request.json();
    const { depositId } = body;

    if (!depositId) {
      return apiError("depositId is required", 400);
    }

    const deposit = await DepositRequest.findById(depositId);
    if (!deposit) {
      return apiError("Deposit not found", 404);
    }

    if (deposit.status === "pending") {
      return apiError("Cannot clear screenshot of pending deposit", 400);
    }

    deposit.screenshot = "";
    await deposit.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin storage DELETE error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}

/**
 * POST /api/admin/storage/clear-all
 * Clear all screenshots from approved/rejected deposits.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (action !== "clear-all") {
      return apiError("Invalid action", 400);
    }

    const result = await DepositRequest.updateMany(
      {
        status: { $in: ["approved", "rejected"] },
        screenshot: { $exists: true, $nin: [null, ""] },
      },
      { $set: { screenshot: "" } },
    );

    return NextResponse.json({
      success: true,
      clearedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Admin storage POST error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
