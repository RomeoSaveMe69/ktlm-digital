import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { KYC } from "@/lib/models/KYC";
import { User } from "@/lib/models/User";
import { Game } from "@/lib/models/Game";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/storage?startDate=&endDate=&limit=25&page=1
 * Returns recharge receipts (with filters/pagination) + storage usage stats.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 25), 200);
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);

    // ── Section A: Recharge receipts ──
    const receiptFilter: Record<string, unknown> = {
      status: { $in: ["approved", "rejected"] },
      screenshot: { $exists: true, $nin: [null, ""] },
    };
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      receiptFilter.createdAt = dateFilter;
    }

    const totalCount = await DepositRequest.countDocuments(receiptFilter);
    const skip = (page - 1) * limit;

    const deposits = await DepositRequest.find(receiptFilter)
      .populate("userId", "email fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    let receiptBytes = 0;
    const items = deposits.map((d) => {
      const len = d.screenshot?.length ?? 0;
      receiptBytes += len;
      return {
        _id: d._id.toString(),
        userEmail: (d.userId as { email?: string })?.email ?? "Unknown",
        userName: (d.userId as { fullName?: string })?.fullName ?? "",
        amount: d.amount,
        status: d.status,
        screenshotSizeKB: +(len / 1024).toFixed(1),
        transactionId: d.transactionId,
        createdAt: d.createdAt,
      };
    });

    // Total receipts size (all, not just current page)
    const allReceiptsAgg = await DepositRequest.aggregate([
      {
        $match: {
          screenshot: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $project: { len: { $strLenBytes: "$screenshot" } },
      },
      {
        $group: { _id: null, total: { $sum: "$len" }, count: { $sum: 1 } },
      },
    ]);
    const allReceiptsMB = +((allReceiptsAgg[0]?.total ?? 0) / (1024 * 1024)).toFixed(2);
    const allReceiptsCount = allReceiptsAgg[0]?.count ?? 0;

    // ── Section B: Storage usage stats (no images returned) ──

    // KYC images
    const kycAgg = await KYC.aggregate([
      {
        $project: {
          frontLen: {
            $cond: [{ $gt: [{ $strLenBytes: { $ifNull: ["$nrcFrontImage", ""] } }, 0] }, { $strLenBytes: "$nrcFrontImage" }, 0],
          },
          backLen: {
            $cond: [{ $gt: [{ $strLenBytes: { $ifNull: ["$nrcBackImage", ""] } }, 0] }, { $strLenBytes: "$nrcBackImage" }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $add: ["$frontLen", "$backLen"] } },
          count: { $sum: 1 },
        },
      },
    ]);

    // Seller profile images
    const sellerAgg = await User.aggregate([
      {
        $match: {
          profileImage: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $project: { len: { $strLenBytes: "$profileImage" } },
      },
      {
        $group: { _id: null, total: { $sum: "$len" }, count: { $sum: 1 } },
      },
    ]);

    // Game images
    const gameAgg = await Game.aggregate([
      {
        $match: {
          image: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $project: { len: { $strLenBytes: "$image" } },
      },
      {
        $group: { _id: null, total: { $sum: "$len" }, count: { $sum: 1 } },
      },
    ]);

    const storageStats = {
      rechargeReceipts: {
        count: allReceiptsCount,
        sizeMB: allReceiptsMB,
      },
      kyc: {
        count: kycAgg[0]?.count ?? 0,
        sizeMB: +((kycAgg[0]?.total ?? 0) / (1024 * 1024)).toFixed(2),
      },
      sellerProfiles: {
        count: sellerAgg[0]?.count ?? 0,
        sizeMB: +((sellerAgg[0]?.total ?? 0) / (1024 * 1024)).toFixed(2),
      },
      gamePhotos: {
        count: gameAgg[0]?.count ?? 0,
        sizeMB: +((gameAgg[0]?.total ?? 0) / (1024 * 1024)).toFixed(2),
      },
    };

    return NextResponse.json({
      items,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      storageStats,
    });
  } catch (err) {
    console.error("Admin storage GET error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}

/** DELETE /api/admin/storage – Clear screenshot from a specific deposit. */
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();
    const body = await request.json();
    const { depositId } = body;

    if (!depositId) return apiError("depositId is required", 400);

    const deposit = await DepositRequest.findById(depositId);
    if (!deposit) return apiError("Deposit not found", 404);
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

/** POST /api/admin/storage – Clear all screenshots from approved/rejected deposits. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (action !== "clear-all") return apiError("Invalid action", 400);

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
