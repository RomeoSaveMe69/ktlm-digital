import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";

const STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "disputed",
] as const;

/**
 * PATCH: Update order status (admin only).
 * Handles escrow balance movements:
 *   - cancelled: refund buyer + reverse seller pendingBalance if 'sent'
 *   - completed: move seller pendingBalance → withdrawableBalance if from 'sent'
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
    }
    const body = await request.json();
    const status = body.status;
    if (!status || !STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Valid status required." },
        { status: 400 },
      );
    }
    await connectDB();

    const order = await Order.findById(id);
    if (!order)
      return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const prevStatus = order.status;
    const sellerAmount = order.sellerReceivedAmount || order.sellerAmount || 0;

    // Handle cancellation: refund buyer, reverse seller pending if applicable
    if (status === "cancelled" && prevStatus !== "cancelled") {
      // Refund buyer
      await User.findByIdAndUpdate(order.buyerId, {
        $inc: { balance: order.price },
      });
      // Restore stock
      await Product.findByIdAndUpdate(order.productId, {
        $inc: { inStock: 1 },
      });
      // If was 'sent', seller had pendingBalance credited — reverse it
      if (prevStatus === "sent" && sellerAmount > 0) {
        await User.findByIdAndUpdate(order.sellerId, {
          $inc: { pendingBalance: -sellerAmount },
        });
      }
    }

    // Handle completion from 'sent': move pendingBalance → withdrawableBalance
    if (status === "completed" && prevStatus === "sent" && sellerAmount > 0) {
      await User.findByIdAndUpdate(order.sellerId, {
        $inc: {
          pendingBalance: -sellerAmount,
          withdrawableBalance: sellerAmount,
        },
      });
      await Product.findByIdAndUpdate(order.productId, {
        $inc: { totalSold: 1 },
      });
    }

    order.status = status;
    if (status === "completed") {
      order.completedAt = new Date();
    }
    await order.save();

    return NextResponse.json({
      order: { id: order._id.toString(), status: order.status },
    });
  } catch (err) {
    console.error("Admin order update error:", err);
    return NextResponse.json(
      { error: "Failed to update order." },
      { status: 500 },
    );
  }
}
