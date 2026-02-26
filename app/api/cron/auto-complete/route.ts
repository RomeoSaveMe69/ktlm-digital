import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const AUTO_COMPLETE_HOURS = 24;

/**
 * POST /api/cron/auto-complete
 * Finds all orders with status 'sent' where sentAt + 24h < now,
 * marks them 'completed', credits seller, increments totalSold.
 *
 * Call via Vercel Cron or any external cron service every ~15 minutes.
 * Protect with a CRON_SECRET header in production.
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDB();

    const cutoff = new Date(Date.now() - AUTO_COMPLETE_HOURS * 60 * 60 * 1000);

    const expiredOrders = await Order.find({
      status: "sent",
      sentAt: { $lte: cutoff },
    }).lean();

    if (expiredOrders.length === 0) {
      return NextResponse.json({ completed: 0 });
    }

    const now = new Date();
    let completedCount = 0;

    for (const order of expiredOrders) {
      await Order.findByIdAndUpdate(order._id, {
        status: "completed",
        completedAt: now,
      });
      await User.findByIdAndUpdate(order.sellerId, {
        $inc: { withdrawableBalance: order.sellerAmount },
      });
      await Product.findByIdAndUpdate(order.productId, {
        $inc: { totalSold: 1 },
      });
      completedCount++;
    }

    return NextResponse.json({ completed: completedCount });
  } catch (err) {
    console.error("Auto-complete cron error:", err);
    return apiError("Auto-complete failed.", 500);
  }
}

/** GET – for health-check / manual trigger from browser. */
export async function GET(request: Request) {
  return POST(request);
}
