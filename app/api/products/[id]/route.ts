import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";
import "@/lib/models/Game";
import "@/lib/models/ProductCategory";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/** GET /api/products/[id] – single product detail for buyer checkout. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectDB();
    const p = await Product.findOne({ _id: id, status: "active", isActive: { $ne: false } })
      .populate("gameId", "title image")
      .populate("productCategoryId", "title image")
      .populate("sellerId", "fullName email shopName profileImage")
      .lean();

    if (!p) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const seller = p.sellerId as { _id?: { toString(): string }; fullName?: string; email?: string; shopName?: string; profileImage?: string } | null;

    return NextResponse.json({
      product: {
        id: p._id.toString(),
        customTitle: p.customTitle || p.title,
        gameId: (p.gameId as { _id?: { toString(): string } })?._id?.toString?.() ?? "",
        gameTitle: (p.gameId as { title?: string })?.title ?? "",
        categoryId:
          (p.productCategoryId as { _id?: { toString(): string } })?._id?.toString?.() ?? "",
        categoryTitle: (p.productCategoryId as { title?: string })?.title ?? "",
        categoryImage: (p.productCategoryId as { image?: string })?.image ?? "",
        sellerId: seller?._id?.toString?.() ?? "",
        sellerName: seller?.shopName || seller?.fullName || seller?.email || "Seller",
        sellerImage: seller?.profileImage ?? "",
        price: p.price,
        inStock: p.inStock,
        deliveryTime: p.deliveryTime,
        totalSold: p.totalSold ?? 0,
        description: p.description ?? "",
        buyerInputs: (p.buyerInputs ?? []).map(
          (bi: { label: string; isRequired: boolean }) => ({
            label: bi.label,
            isRequired: bi.isRequired,
          }),
        ),
      },
    });
  } catch (err) {
    console.error("Product detail error:", err);
    return apiError("Failed to load product.", 500);
  }
}
