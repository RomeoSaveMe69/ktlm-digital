import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { WithdrawalRequest } from "@/lib/models/WithdrawalRequest";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sellers
 * Supports:
 *   ?page=1&limit=10&sortBy=createdAt&sortOrder=desc
 *   ?sid=SID0000001  (search by exact SID — returns detail view)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const sp = request.nextUrl.searchParams;

    // ── Detail search by SID ──
    const sidSearch = sp.get("sid")?.trim();
    if (sidSearch) {
      const user = await User.findOne({ sid: sidSearch, role: "seller" })
        .select("-passwordHash")
        .lean();
      if (!user) return NextResponse.json({ seller: null });

      const userId = user._id;

      const [withdrawals, salesOrders, salesCompletedCount] = await Promise.all(
        [
          WithdrawalRequest.find({ sellerId: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(),
          Order.find({ sellerId: userId })
            .populate("productId", "customTitle title")
            .populate("buyerId", "email fullName bid")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(),
          Order.countDocuments({ sellerId: userId, status: "completed" }),
        ],
      );

      return NextResponse.json({
        seller: {
          id: user._id.toString(),
          bid: user.bid ?? "",
          sid: user.sid ?? "",
          email: user.email,
          fullName: user.fullName ?? "",
          role: user.role,
          balance: user.balance ?? 0,
          withdrawableBalance: user.withdrawableBalance ?? 0,
          pendingBalance: user.pendingBalance ?? 0,
          withdrawPendingBalance: user.withdrawPendingBalance ?? 0,
          telegramUsername: user.telegramUsername ?? "",
          createdAt: user.createdAt,
          salesCompleted: salesCompletedCount,
        },
        withdrawals: withdrawals.map((w) => ({
          id: w._id.toString(),
          amount: w.amount,
          paymentMethod: w.paymentMethod,
          accountName: w.accountName,
          paymentNumber: w.paymentNumber ?? "",
          status: w.status,
          createdAt: w.createdAt,
        })),
        sales: salesOrders.map((o) => ({
          id: o._id.toString(),
          orderId: o.orderId,
          productTitle:
            (o.productId as { customTitle?: string })?.customTitle ||
            (o.productId as { title?: string })?.title ||
            "Product",
          buyerName:
            (o.buyerId as { fullName?: string })?.fullName ||
            (o.buyerId as { email?: string })?.email ||
            "",
          price: o.price,
          feeAmount: o.feeAmount ?? o.platformFee ?? 0,
          sellerReceivedAmount:
            o.sellerReceivedAmount ?? o.sellerAmount ?? 0,
          status: o.status,
          createdAt: o.createdAt,
        })),
      });
    }

    // ── Paginated list ──
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = [10, 25, 100].includes(Number(sp.get("limit")))
      ? Number(sp.get("limit"))
      : 10;
    const sortBy = sp.get("sortBy") ?? "createdAt";
    const sortOrder = sp.get("sortOrder") === "asc" ? 1 : -1;

    const allowedSorts = [
      "withdrawableBalance",
      "createdAt",
      "salesCompleted",
    ];

    if (sortBy === "salesCompleted") {
      const pipeline: mongoose.PipelineStage[] = [
        { $match: { role: "seller" } },
        {
          $lookup: {
            from: "orders",
            let: { uid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$sellerId", "$$uid"] },
                      { $eq: ["$status", "completed"] },
                    ],
                  },
                },
              },
              { $count: "count" },
            ],
            as: "orderStats",
          },
        },
        {
          $addFields: {
            salesCompleted: {
              $ifNull: [{ $arrayElemAt: ["$orderStats.count", 0] }, 0],
            },
          },
        },
        { $sort: { salesCompleted: sortOrder } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { passwordHash: 0, orderStats: 0 } },
      ];

      const [sellers, totalArr] = await Promise.all([
        User.aggregate(pipeline),
        User.countDocuments({ role: "seller" }),
      ]);

      return NextResponse.json({
        sellers: sellers.map((u) => ({
          id: u._id.toString(),
          sid: u.sid ?? "",
          email: u.email,
          fullName: u.fullName ?? "",
          withdrawableBalance: u.withdrawableBalance ?? 0,
          telegramUsername: u.telegramUsername ?? "",
          createdAt: u.createdAt,
          salesCompleted: u.salesCompleted ?? 0,
        })),
        total: totalArr,
        page,
        limit,
      });
    }

    const mongoSort: Record<string, 1 | -1> = {};
    if (allowedSorts.includes(sortBy)) {
      mongoSort[sortBy] = sortOrder;
    } else {
      mongoSort.createdAt = -1;
    }

    const filter = { role: "seller" as const };
    const [sellers, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort(mongoSort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const sellerIds = sellers.map((u) => u._id);
    const salesCounts = await Order.aggregate([
      { $match: { sellerId: { $in: sellerIds }, status: "completed" } },
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      salesCounts.map((o) => [o._id.toString(), o.count]),
    );

    return NextResponse.json({
      sellers: sellers.map((u) => ({
        id: u._id.toString(),
        sid: u.sid ?? "",
        email: u.email,
        fullName: u.fullName ?? "",
        withdrawableBalance: u.withdrawableBalance ?? 0,
        telegramUsername: u.telegramUsername ?? "",
        createdAt: u.createdAt,
        salesCompleted: countMap.get(u._id.toString()) ?? 0,
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Admin sellers list error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
