import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";

const STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "disputed",
] as const;

/** PATCH: Update order status (admin only) */
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
    const update: Record<string, unknown> = { status };
    if (status === "completed") {
      update.completedAt = new Date();
    }
    const order = await Order.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
    if (!order)
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
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
