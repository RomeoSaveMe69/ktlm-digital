import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { apiError } from "@/lib/api-utils";
import "@/lib/models/Product";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/** GET /api/seller/orders?status= – list orders for current seller. */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? "";
    const oidSearch = searchParams.get("oid")?.trim() ?? "";

    await connectDB();

    const query: Record<string, unknown> = {
      sellerId: new mongoose.Types.ObjectId(String(session.userId)),
    };
    if (oidSearch) {
      query.orderId = { $regex: oidSearch, $options: "i" };
    }
    if (["pending", "processing", "sent", "completed", "cancelled"].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const orders = await Order.find(query)
      .populate("productId", "customTitle title")
      .populate("buyerId", "email fullName")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      orders: orders.map((o) => {
        const buyer = o.buyerId as { _id?: { toString(): string }; email?: string; fullName?: string } | undefined;
        return {
          id: o._id.toString(),
          orderId: o.orderId,
          productTitle:
            (o.productId as { customTitle?: string })?.customTitle ||
            (o.productId as { title?: string })?.title ||
            "Product",
          buyerId: buyer?._id?.toString() ?? "",
          buyerEmail: buyer?.email ?? "",
          buyerName: buyer?.fullName ?? "",
          price: o.price,
          buyerInputData: o.buyerInputData,
          status: o.status,
          sentAt: o.sentAt ?? null,
          completedAt: o.completedAt ?? null,
          createdAt: o.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error("Seller orders GET error:", err);
    return apiError("Failed to load orders.", 500);
  }
}
