import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";
// Must import all models referenced in populate() so Mongoose registers their schemas
import "@/lib/models/Game";
import "@/lib/models/ProductCategory";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/**
 * GET /api/products?gameId=&categoryId=&sort=price_asc|sold_desc&limit=
 * Public product listing for buyer-facing game/category pages.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId") ?? "";
    const categoryId = searchParams.get("categoryId") ?? "";
    const sort = searchParams.get("sort") ?? "price_asc";
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    await connectDB();

    const query: Record<string, unknown> = { status: "active", isActive: { $ne: false } };
    if (gameId) query.gameId = gameId;
    if (categoryId) query.productCategoryId = categoryId;

    const sortObj: Record<string, 1 | -1> =
      sort === "sold_desc" ? { totalSold: -1 } : { price: 1 };

    const products = await Product.find(query)
      .populate("gameId", "title image")
      .populate("productCategoryId", "title")
      .populate("sellerId", "fullName email shopName profileImage")
      .sort(sortObj)
      .limit(limit)
      .lean();

    return NextResponse.json({
      products: products.map((p) => {
        const seller = p.sellerId as { _id?: { toString(): string }; fullName?: string; email?: string; shopName?: string; profileImage?: string } | null;
        return {
        id: p._id.toString(),
        customTitle: p.customTitle || p.title,
        gameId: (p.gameId as { _id?: { toString(): string } })?._id?.toString?.() ?? "",
        gameTitle: (p.gameId as { title?: string })?.title ?? "",
        categoryId:
          (p.productCategoryId as { _id?: { toString(): string } })?._id?.toString?.() ?? "",
        categoryTitle: (p.productCategoryId as { title?: string })?.title ?? "",
        sellerId: seller?._id?.toString?.() ?? "",
        sellerName: seller?.shopName || seller?.fullName || seller?.email || "Seller",
        sellerImage: seller?.profileImage ?? "",
        price: p.price,
        inStock: p.inStock,
        deliveryTime: p.deliveryTime,
        totalSold: p.totalSold ?? 0,
        description: p.description ?? "",
        buyerInputs: p.buyerInputs ?? [],
      };
      }),
    });
  } catch (err) {
    console.error("Products public list error:", err);
    return apiError("Failed to load products.", 500);
  }
}
