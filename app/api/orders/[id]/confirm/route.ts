import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/confirm – buyer confirms receipt.
 *
 * Escrow Settlement:
 *   1. Order status → 'completed', completedAt = now
 *   2. Seller's pendingBalance -= sellerReceivedAmount
 *   3. Seller's withdrawableBalance += sellerReceivedAmount (Total Sale Money)
 *   4. Product.totalSold += 1
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(id),
      buyerId: new mongoose.Types.ObjectId(String(session.userId)),
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.status !== "sent") {
      return NextResponse.json(
        { error: "Order must be in 'sent' status to confirm." },
        { status: 400 },
      );
    }

    // Use new field if available, fall back to legacy
    const sellerAmount = order.sellerReceivedAmount || order.sellerAmount || 0;

    order.status = "completed";
    order.completedAt = new Date();
    await order.save();

    // Move from pendingBalance to withdrawableBalance
    await User.findByIdAndUpdate(order.sellerId, {
      $inc: {
        pendingBalance: -sellerAmount,
        withdrawableBalance: sellerAmount,
      },
    });

    // Increment product totalSold
    await Product.findByIdAndUpdate(order.productId, {
      $inc: { totalSold: 1 },
    });

    return NextResponse.json({ ok: true, status: "completed" });
  } catch (err) {
    console.error("Order confirm error:", err);
    return apiError("Failed to confirm order.", 500);
  }
}
