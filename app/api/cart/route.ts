import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";
import "@/lib/models/Game";
import "@/lib/models/ProductCategory";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/** GET /api/cart – list current user's cart items. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const items = await Cart.find({ userId: session.userId })
      .populate({
        path: "productId",
        select: "customTitle title price inStock status gameId productCategoryId sellerId",
        populate: [
          { path: "gameId", select: "title" },
          { path: "productCategoryId", select: "title" },
          { path: "sellerId", select: "fullName email" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: items.map((item) => {
        const p = item.productId as Record<string, unknown>;
        return {
          cartId: item._id.toString(),
          productId: (p?._id as { toString(): string })?.toString() ?? "",
          customTitle:
            (p?.customTitle as string) || (p?.title as string) || "Product",
          gameTitle: ((p?.gameId as { title?: string })?.title) ?? "",
          categoryTitle: ((p?.productCategoryId as { title?: string })?.title) ?? "",
          sellerName:
            ((p?.sellerId as { fullName?: string })?.fullName) ||
            ((p?.sellerId as { email?: string })?.email) ||
            "Seller",
          price: (p?.price as number) ?? 0,
          inStock: (p?.inStock as number) ?? 0,
          status: (p?.status as string) ?? "",
          quantity: item.quantity,
        };
      }),
    });
  } catch (err) {
    console.error("Cart GET error:", err);
    return apiError("Failed to load cart.", 500);
  }
}

/** POST /api/cart – add a product to cart. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const productId = String(body.productId ?? "").trim();
    if (!productId) {
      return NextResponse.json(
        { error: "productId is required." },
        { status: 400 },
      );
    }
    await connectDB();
    const product = await Product.findOne({
      _id: productId,
      status: "active",
    }).lean();
    if (!product) {
      return NextResponse.json(
        { error: "Product not found or inactive." },
        { status: 404 },
      );
    }
    const cartItem = await Cart.findOneAndUpdate(
      { userId: session.userId, productId },
      { $set: { quantity: 1 } },
      { upsert: true, new: true },
    );
    return NextResponse.json({ cartId: cartItem._id.toString() });
  } catch (err) {
    console.error("Cart POST error:", err);
    return apiError("Failed to add to cart.", 500);
  }
}
