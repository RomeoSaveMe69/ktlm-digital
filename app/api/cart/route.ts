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
        select: "customTitle title price inStock status gameId productCategoryId sellerId totalSold buyerInputs",
        populate: [
          { path: "gameId", select: "title image" },
          { path: "productCategoryId", select: "title" },
          { path: "sellerId", select: "fullName email" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: items.map((item) => {
        const p = item.productId as Record<string, unknown>;
        const sellerId = p?.sellerId as { _id?: { toString(): string }; fullName?: string; email?: string } | undefined;
        return {
          cartId: item._id.toString(),
          productId: (p?._id as { toString(): string })?.toString() ?? "",
          customTitle: (p?.customTitle as string) || (p?.title as string) || "Product",
          gameTitle: ((p?.gameId as { title?: string })?.title) ?? "",
          gameImage: ((p?.gameId as { image?: string })?.image) ?? "",
          categoryTitle: ((p?.productCategoryId as { title?: string })?.title) ?? "",
          sellerId: sellerId?._id?.toString() ?? "",
          sellerName: sellerId?.fullName || sellerId?.email || "Seller",
          price: (p?.price as number) ?? 0,
          inStock: (p?.inStock as number) ?? 0,
          status: (p?.status as string) ?? "",
          quantity: item.quantity,
          buyerInputData: item.buyerInputData ?? [],
          buyerInputs: (p?.buyerInputs as { label: string; isRequired: boolean }[]) ?? [],
        };
      }),
    });
  } catch (err) {
    console.error("Cart GET error:", err);
    return apiError("Failed to load cart.", 500);
  }
}

/** POST /api/cart – add a product to cart with buyerInputData. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const productId = String(body.productId ?? "").trim();
    const buyerInputData: { label: string; value: string }[] = Array.isArray(body.buyerInputData)
      ? body.buyerInputData.map((d: { label: string; value: string }) => ({
          label: String(d.label ?? ""),
          value: String(d.value ?? ""),
        }))
      : [];

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }
    await connectDB();
    const product = await Product.findOne({ _id: productId, status: "active" }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found or inactive." }, { status: 404 });
    }

    // Validate required fields
    const missing = (product.buyerInputs ?? [])
      .filter((bi: { label: string; isRequired: boolean }) => bi.isRequired)
      .filter((bi: { label: string; isRequired: boolean }) => {
        const found = buyerInputData.find((d) => d.label === bi.label);
        return !found || !found.value.trim();
      })
      .map((bi: { label: string; isRequired: boolean }) => bi.label);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Required fields missing: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    const cartItem = await Cart.findOneAndUpdate(
      { userId: session.userId, productId },
      { $set: { quantity: 1, buyerInputData } },
      { upsert: true, new: true },
    );
    return NextResponse.json({ cartId: cartItem._id.toString() });
  } catch (err) {
    console.error("Cart POST error:", err);
    return apiError("Failed to add to cart.", 500);
  }
}

/** DELETE /api/cart – remove item(s). Body: { cartId } or { cartIds: [] } */
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    await connectDB();

    if (body.cartIds && Array.isArray(body.cartIds)) {
      await Cart.deleteMany({ _id: { $in: body.cartIds }, userId: session.userId });
    } else if (body.cartId) {
      await Cart.deleteOne({ _id: body.cartId, userId: session.userId });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cart DELETE error:", err);
    return apiError("Failed to remove from cart.", 500);
  }
}
