import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/cart/checkout
 * Body: { cartIds: string[] } — only checked/selected cart items.
 * Creates an order for each cart item, deducting balance once for the total.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);

    const { cartIds } = await request.json();
    if (!Array.isArray(cartIds) || cartIds.length === 0) {
      return apiError("No items selected for checkout.", 400);
    }

    await connectDB();

    const items = await Cart.find({
      _id: { $in: cartIds },
      userId: session.userId,
    }).lean();

    if (items.length === 0) return apiError("Cart items not found.", 404);

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, status: "active" }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let totalPrice = 0;
    const orderData: {
      product: typeof products[0];
      cartItem: typeof items[0];
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId.toString());
      if (!product) return apiError(`Product not found for cart item.`, 400);
      if (product.inStock <= 0) return apiError(`${product.customTitle || product.title} is out of stock.`, 400);
      totalPrice += product.price;
      orderData.push({ product, cartItem: item });
    }

    // Deduct total from buyer
    const buyer = await User.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(String(session.userId)),
        balance: { $gte: totalPrice },
      },
      { $inc: { balance: -totalPrice } },
      { new: true },
    );
    if (!buyer) return apiError("Insufficient balance.", 400);

    const createdOrders: string[] = [];
    for (const { product, cartItem } of orderData) {
      await Product.findByIdAndUpdate(product._id, { $inc: { inStock: -1 } });
      const order = await Order.create({
        buyerId: new mongoose.Types.ObjectId(String(session.userId)),
        sellerId: product.sellerId,
        productId: product._id,
        price: product.price,
        platformFee: 0,
        sellerAmount: 0,
        feeAmount: 0,
        sellerReceivedAmount: 0,
        buyerInputData: cartItem.buyerInputData ?? [],
        status: "pending",
      });
      createdOrders.push(order.orderId);
    }

    // Remove checked items from cart
    await Cart.deleteMany({ _id: { $in: cartIds }, userId: session.userId });

    return NextResponse.json({
      ok: true,
      orderCount: createdOrders.length,
      orderIds: createdOrders,
      totalPrice,
    });
  } catch (err) {
    console.error("Cart checkout error:", err);
    return apiError("Checkout failed.", 500);
  }
}
