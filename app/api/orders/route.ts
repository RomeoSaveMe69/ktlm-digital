import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";

const PLATFORM_FEE_RATE = 0.005; // 0.5%

/** GET: List current user's orders */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const orders = await Order.find({
      $or: [{ buyerId: session.userId }, { sellerId: session.userId }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("productId", "title price")
      .lean();

    const list = orders.map((o) => ({
      id: o._id.toString(),
      buyerId: o.buyerId.toString(),
      sellerId: o.sellerId.toString(),
      product: o.productId,
      playerId: o.playerId,
      amountMmk: o.amountMmk,
      platformFeeMmk: o.platformFeeMmk,
      status: o.status,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({ orders: list });
  } catch (err) {
    console.error("Orders list error:", err);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}

/** POST: Create a new game top-up order (saved to MongoDB) */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, playerId } = body;
    if (!productId || !playerId || typeof playerId !== "string") {
      return NextResponse.json(
        { error: "productId and playerId are required." },
        { status: 400 },
      );
    }

    await connectDB();

    const product = await Product.findById(productId).lean();
    if (!product || (product as { status?: string }).status !== "active") {
      return NextResponse.json(
        { error: "Product not found or inactive." },
        { status: 404 },
      );
    }
    const price = (product as { price: number }).price;
    const amountMmk = price;
    const platformFeeMmk = Math.round(amountMmk * PLATFORM_FEE_RATE);

    const order = await Order.create({
      buyerId: new mongoose.Types.ObjectId(session.userId),
      sellerId: product.sellerId,
      productId: product._id,
      playerId: playerId.trim(),
      amountMmk,
      platformFeeMmk,
      status: "pending",
      fulfillmentType: "manual",
    });

    return NextResponse.json({
      order: {
        id: order._id.toString(),
        amountMmk: order.amountMmk,
        platformFeeMmk: order.platformFeeMmk,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("Order create error:", err);
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 },
    );
  }
}
