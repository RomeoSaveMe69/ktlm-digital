import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { WithdrawalRequest } from "@/lib/models/WithdrawalRequest";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/overview?sid=&startDate=&endDate=
 * Returns metric cards + chart data for admin dashboard.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const sidParam = searchParams.get("sid")?.trim() || "";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";

    // Resolve SID to a seller user ObjectId
    let sellerObjectId: mongoose.Types.ObjectId | null = null;
    if (sidParam) {
      const sellerUser = await User.findOne({ sid: sidParam }).select("_id").lean();
      if (sellerUser) {
        sellerObjectId = sellerUser._id as mongoose.Types.ObjectId;
      }
    }

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // ── Metric Cards ──

    // 1. Total User Money
    const totalUserMoneyAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]);
    const totalUserMoney = totalUserMoneyAgg[0]?.total ?? 0;

    // 2. Total Deposit Pending
    const depositPendingAgg = await DepositRequest.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const depositPending = depositPendingAgg[0]?.total ?? 0;

    // 3. Withdrawable Money
    const withdrawableMatch: Record<string, unknown> = {};
    if (sellerObjectId) withdrawableMatch._id = sellerObjectId;
    else withdrawableMatch.role = { $in: ["seller", "admin"] };
    const withdrawableAgg = await User.aggregate([
      { $match: withdrawableMatch },
      { $group: { _id: null, total: { $sum: "$withdrawableBalance" } } },
    ]);
    const withdrawableMoney = withdrawableAgg[0]?.total ?? 0;

    // Build order match for filtered stats
    const orderMatch: Record<string, unknown> = {};
    if (sellerObjectId) orderMatch.sellerId = sellerObjectId;
    if (hasDateFilter) orderMatch.createdAt = dateFilter;

    // 4. Total Sale (sum of price)
    const totalSaleAgg = await Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);
    const totalSale = totalSaleAgg[0]?.total ?? 0;

    // 5. Total Order (count)
    const totalOrderCount = await Order.countDocuments(orderMatch);

    // 6. Withdraw Pending (count)
    const withdrawPendingMatch: Record<string, unknown> = { status: "pending" };
    if (sellerObjectId) withdrawPendingMatch.sellerId = sellerObjectId;
    const withdrawPendingCount = await WithdrawalRequest.countDocuments(withdrawPendingMatch);

    // ── Chart Data ──

    // Daily Sale Amount (last 30 days or filtered range)
    const dailySaleAgg = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 90 },
    ]);

    // Monthly Sale Amount
    const monthlySaleAgg = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          amount: { $sum: "$price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Daily Recharge (deposit approved amounts)
    const rechargeMatch: Record<string, unknown> = { status: "approved" };
    if (hasDateFilter) rechargeMatch.createdAt = dateFilter;
    const dailyRechargeAgg = await DepositRequest.aggregate([
      { $match: rechargeMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 90 },
    ]);

    return NextResponse.json({
      totalUserMoney,
      depositPending,
      withdrawableMoney,
      totalSale,
      totalOrderCount,
      withdrawPendingCount,
      charts: {
        dailySale: dailySaleAgg.map((d) => ({
          date: d._id,
          amount: d.amount,
          orders: d.count,
        })),
        monthlySale: monthlySaleAgg.map((d) => ({
          month: d._id,
          amount: d.amount,
          orders: d.count,
        })),
        dailyRecharge: dailyRechargeAgg.map((d) => ({
          date: d._id,
          amount: d.amount,
        })),
      },
    });
  } catch (err) {
    console.error("Admin overview error:", err);
    return apiError("Failed to load overview stats.", 500);
  }
}
