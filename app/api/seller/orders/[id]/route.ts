import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const STATUS_FLOW: Record<string, string> = {
  pending: "processing",
  processing: "sent",
};

/**
 * PATCH /api/seller/orders/[id] – advance order status: pending→processing→sent.
 * Body: { action: 'advance' | 'cancel' }
 * Setting status to 'sent' records sentAt for the 24h auto-complete timer.
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

    if (action === "cancel") {
      if (order.status !== "pending") {
        return NextResponse.json(
          { error: "Only pending orders can be cancelled." },
          { status: 400 },
        );
      }
      order.status = "cancelled";
    } else {
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
      }
    }

    await order.save();
    return NextResponse.json({ ok: true, status: order.status, sentAt: order.sentAt ?? null });
  } catch (err) {
    console.error("Seller order PATCH error:", err);
    return apiError("Failed to update order.", 500);
  }
}
