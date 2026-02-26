import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const PLATFORM_FEE_RATE = 0.005; // 0.5%

/** GET /api/orders – list current buyer's orders. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const orders = await Order.find({ buyerId: session.userId })
      .populate("productId", "customTitle title gameId productCategoryId")
      .populate({ path: "productId", populate: { path: "gameId", select: "title" } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        orderId: o.orderId,
        productId: (o.productId as { _id?: { toString(): string } })?._id?.toString?.() ?? "",
        productTitle:
          (o.productId as { customTitle?: string })?.customTitle ||
          (o.productId as { title?: string })?.title ||
          "Product",
        gameTitle:
          (o.productId as { gameId?: { title?: string } })?.gameId?.title ?? "",
        price: o.price,
        platformFee: o.platformFee,
        buyerInputData: o.buyerInputData,
        status: o.status,
        sentAt: o.sentAt ?? null,
        completedAt: o.completedAt ?? null,
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error("Orders GET error:", err);
    return apiError("Failed to load orders.", 500);
  }
}

/**
 * POST /api/orders – "Buy Now": validate balance, deduct, create order.
 * Body: { productId, buyerInputData: [{ label, value }] }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in to place an order." }, { status: 401 });
    }

    const body = await request.json();
    const productId = String(body.productId ?? "").trim();
    const buyerInputData: { label: string; value: string }[] = Array.isArray(body.buyerInputData)
      ? body.buyerInputData.map((d: { label: string; value: string }) => ({
          label: String(d.label ?? ""),
          value: String(d.value ?? ""),
        }))
      : [];

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Valid productId is required." }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findOne({ _id: productId, status: "active" }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found or inactive." }, { status: 404 });
    }
    if (product.inStock <= 0) {
      return NextResponse.json({ error: "Product is out of stock." }, { status: 400 });
    }

    // Validate required buyer inputs
    const missing = (product.buyerInputs ?? [])
      .filter((bi) => bi.isRequired)
      .filter((bi) => {
        const found = buyerInputData.find((d) => d.label === bi.label);
        return !found || !found.value.trim();
      })
      .map((bi) => bi.label);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Required fields missing: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    const price = product.price;
    const platformFee = Math.round(price * PLATFORM_FEE_RATE);
    const sellerAmount = price - platformFee;

    // Atomically deduct buyer balance
    const buyer = await User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(String(session.userId)),
        balance: { $gte: price },
      },
      { $inc: { balance: -price } },
      { new: true },
    );
    if (!buyer) {
      return NextResponse.json(
        { error: "Insufficient balance. Please deposit first." },
        { status: 400 },
      );
    }

    // Reduce product stock
    await Product.findByIdAndUpdate(productId, { $inc: { inStock: -1 } });

    const order = await Order.create({
      buyerId: new mongoose.Types.ObjectId(String(session.userId)),
      sellerId: product.sellerId,
      productId: product._id,
      price,
      platformFee,
      sellerAmount,
      buyerInputData,
      status: "pending",
    });

    return NextResponse.json({
      order: {
        id: order._id.toString(),
        orderId: order.orderId,
        price: order.price,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("Order create error:", err);
    return apiError("Failed to create order.", 500);
  }
}
