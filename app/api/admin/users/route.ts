import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Supports:
 *   ?page=1&limit=10&sortBy=createdAt&sortOrder=desc
 *   ?bid=BID0000001  (search by exact BID — returns detail view)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const sp = request.nextUrl.searchParams;

    // ── Detail search by BID ──
    const bidSearch = sp.get("bid")?.trim();
    if (bidSearch) {
      const user = await User.findOne({ bid: bidSearch })
        .select("-passwordHash")
        .lean();
      if (!user) return NextResponse.json({ user: null });

      const userId = user._id;

      const [deposits, orders, completedCount] = await Promise.all([
        DepositRequest.find({ userId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
        Order.find({ buyerId: userId })
          .populate("productId", "customTitle title")
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
        Order.countDocuments({ buyerId: userId, status: "completed" }),
      ]);

      return NextResponse.json({
        user: {
          id: user._id.toString(),
          bid: user.bid ?? "",
          sid: user.sid ?? "",
          email: user.email,
          fullName: user.fullName ?? "",
          role: user.role,
          balance: user.balance,
          telegramUsername: user.telegramUsername ?? "",
          createdAt: user.createdAt,
          completedOrders: completedCount,
        },
        deposits: deposits.map((d) => ({
          id: d._id.toString(),
          amount: d.amount,
          status: d.status,
          transactionId: d.transactionId,
          createdAt: d.createdAt,
        })),
        orders: orders.map((o) => ({
          id: o._id.toString(),
          orderId: o.orderId,
          productTitle:
            (o.productId as { customTitle?: string })?.customTitle ||
            (o.productId as { title?: string })?.title ||
            "Product",
          price: o.price,
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

    const allowedSorts = ["balance", "createdAt", "completedOrders"];
    const mongoSort: Record<string, 1 | -1> = {};

    if (sortBy === "completedOrders") {
      // Need aggregation for computed field
      const pipeline: mongoose.PipelineStage[] = [
        { $match: { passwordHash: { $exists: true } } },
        {
          $lookup: {
            from: "orders",
            let: { uid: "$_id" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$buyerId", "$$uid"] }, { $eq: ["$status", "completed"] }] } } },
              { $count: "count" },
            ],
            as: "orderStats",
          },
        },
        {
          $addFields: {
            completedOrders: {
              $ifNull: [{ $arrayElemAt: ["$orderStats.count", 0] }, 0],
            },
          },
        },
        { $sort: { completedOrders: sortOrder } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            passwordHash: 0,
            orderStats: 0,
          },
        },
      ];

      const [users, totalArr] = await Promise.all([
        User.aggregate(pipeline),
        User.countDocuments(),
      ]);

      return NextResponse.json({
        users: users.map((u) => ({
          id: u._id.toString(),
          bid: u.bid ?? "",
          email: u.email,
          fullName: u.fullName ?? "",
          role: u.role,
          balance: u.balance ?? 0,
          telegramUsername: u.telegramUsername ?? "",
          createdAt: u.createdAt,
          completedOrders: u.completedOrders ?? 0,
        })),
        total: totalArr,
        page,
        limit,
      });
    }

    if (allowedSorts.includes(sortBy)) {
      mongoSort[sortBy] = sortOrder;
    } else {
      mongoSort.createdAt = -1;
    }

    const [users, total] = await Promise.all([
      User.find()
        .select("-passwordHash")
        .sort(mongoSort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    // Fetch completed order counts for these users
    const userIds = users.map((u) => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { buyerId: { $in: userIds }, status: "completed" } },
      { $group: { _id: "$buyerId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      orderCounts.map((o) => [o._id.toString(), o.count]),
    );

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        bid: u.bid ?? "",
        email: u.email,
        fullName: u.fullName ?? "",
        role: u.role,
        balance: u.balance ?? 0,
        telegramUsername: u.telegramUsername ?? "",
        createdAt: u.createdAt,
        completedOrders: countMap.get(u._id.toString()) ?? 0,
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Admin users list error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
