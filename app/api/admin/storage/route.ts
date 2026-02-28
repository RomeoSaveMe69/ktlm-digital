import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { KYC } from "@/lib/models/KYC";
import { User } from "@/lib/models/User";
import { Game } from "@/lib/models/Game";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { deleteImage } from "@/lib/cloudinary";
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

    const items = deposits.map((d) => ({
      _id: d._id.toString(),
      userEmail: (d.userId as { email?: string })?.email ?? "Unknown",
      userName: (d.userId as { fullName?: string })?.fullName ?? "",
      amount: d.amount,
      status: d.status,
      transactionId: d.transactionId,
      createdAt: d.createdAt,
    }));

    const allReceiptsCount = await DepositRequest.countDocuments({
      screenshot: { $exists: true, $nin: [null, ""] },
    });

    // ── Section B: Image counts + MongoDB space used ──
    // base64 data: URLs stored in MongoDB use space; Cloudinary URLs are tiny strings
    const kycAgg = await KYC.aggregate([
      {
        $match: {
          $or: [
            { nrcFrontImage: { $exists: true, $nin: [null, ""] } },
            { nrcBackImage: { $exists: true, $nin: [null, ""] } },
          ],
        },
      },
      {
        $project: {
          fLen: { $strLenBytes: { $ifNull: ["$nrcFrontImage", ""] } },
          bLen: { $strLenBytes: { $ifNull: ["$nrcBackImage", ""] } },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $add: ["$fLen", "$bLen"] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const sellerAgg = await User.aggregate([
      { $match: { profileImage: { $exists: true, $nin: [null, ""] } } },
      { $project: { len: { $strLenBytes: "$profileImage" } } },
      { $group: { _id: null, total: { $sum: "$len" }, count: { $sum: 1 } } },
    ]);

    const gameAgg = await Game.aggregate([
      { $match: { image: { $exists: true, $nin: [null, ""] } } },
      { $project: { len: { $strLenBytes: "$image" } } },
      { $group: { _id: null, total: { $sum: "$len" }, count: { $sum: 1 } } },
    ]);

    const prodCatAgg = await ProductCategory.aggregate([
      { $match: { image: { $exists: true, $nin: [null, ""] } } },
      { $project: { len: { $strLenBytes: "$image" } } },
      { $group: { _id: null, total: { $sum: "$len" }, count: { $sum: 1 } } },
    ]);

    const toMB = (bytes: number) => +(bytes / (1024 * 1024)).toFixed(2);

    const storageStats = {
      rechargeReceipts: { count: allReceiptsCount },
      kyc: {
        count: kycAgg[0]?.count ?? 0,
        sizeMB: toMB(kycAgg[0]?.total ?? 0),
      },
      sellerProfiles: {
        count: sellerAgg[0]?.count ?? 0,
        sizeMB: toMB(sellerAgg[0]?.total ?? 0),
      },
      gamePhotos: {
        count: gameAgg[0]?.count ?? 0,
        sizeMB: toMB(gameAgg[0]?.total ?? 0),
      },
      productPhotos: {
        count: prodCatAgg[0]?.count ?? 0,
        sizeMB: toMB(prodCatAgg[0]?.total ?? 0),
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

    if (deposit.screenshot?.includes("cloudinary.com")) {
      await deleteImage(deposit.screenshot).catch(() => {});
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
