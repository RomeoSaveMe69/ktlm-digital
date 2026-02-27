import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { getSiteSettings } from "@/lib/models/SiteSetting";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const STATUS_FLOW: Record<string, string> = {
  pending: "processing",
  processing: "sent",
};

/**
 * PATCH /api/seller/orders/[id] – advance order or cancel.
 * Body: { action: 'advance' | 'cancel' }
 *
 * Cancel (only from 'pending'):
 *   - Refund buyer 100% (no fee deducted).
 *   - Restore product stock.
 *
 * Advance to 'sent':
 *   - Fetch SiteSetting for dynamic fee rates.
 *   - If price >= thresholdAmount → use thresholdTradeFee, else normalTradeFee.
 *   - Calculate feeAmount and sellerReceivedAmount.
 *   - Add sellerReceivedAmount to seller's pendingBalance.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action === "cancel" ? "cancel" : "advance";

    await connectDB();

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(id),
      sellerId: new mongoose.Types.ObjectId(String(session.userId)),
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // ───── CANCEL ─────
    if (action === "cancel") {
      if (order.status !== "pending") {
        return NextResponse.json(
          { error: "Only pending orders can be cancelled." },
          { status: 400 },
        );
      }

      order.status = "cancelled";
      await order.save();

      // Refund buyer 100%
      await User.findByIdAndUpdate(order.buyerId, {
        $inc: { balance: order.price },
      });

      // Restore product stock
      await Product.findByIdAndUpdate(order.productId, {
        $inc: { inStock: 1 },
      });

      return NextResponse.json({
        ok: true,
        status: "cancelled",
        refunded: order.price,
      });
    }

    // ───── ADVANCE ─────
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) {
      return NextResponse.json(
        { error: `Cannot advance from '${order.status}'.` },
        { status: 400 },
      );
    }

    order.status = nextStatus as typeof order.status;

    if (nextStatus === "sent") {
      order.sentAt = new Date();

      // Calculate trade fee from SiteSetting
      const settings = await getSiteSettings();
      const feeRate =
        order.price >= settings.thresholdAmount
          ? settings.thresholdTradeFee
          : settings.normalTradeFee;

      // feeRate is stored as percentage (e.g. 0.5 = 0.5%), convert to decimal
      const feeAmount = Math.round(order.price * (feeRate / 100));
      const sellerReceivedAmount = order.price - feeAmount;

      order.feeAmount = feeAmount;
      order.sellerReceivedAmount = sellerReceivedAmount;
      // Also set legacy fields for backward compat
      order.platformFee = feeAmount;
      order.sellerAmount = sellerReceivedAmount;

      await order.save();

      // Add sellerReceivedAmount to seller's pendingBalance
      await User.findByIdAndUpdate(order.sellerId, {
        $inc: { pendingBalance: sellerReceivedAmount },
      });
    } else {
      await order.save();
    }

    return NextResponse.json({
      ok: true,
      status: order.status,
      sentAt: order.sentAt ?? null,
      feeAmount: order.feeAmount,
      sellerReceivedAmount: order.sellerReceivedAmount,
    });
  } catch (err) {
    console.error("Seller order PATCH error:", err);
    return apiError("Failed to update order.", 500);
  }
}
