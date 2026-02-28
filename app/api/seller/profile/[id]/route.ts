import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { Review } from "@/lib/models/Review";
import { apiError } from "@/lib/api-utils";
import "@/lib/models/Game";
import "@/lib/models/ProductCategory";

export const dynamic = "force-dynamic";

/** GET /api/seller/profile/[id] – public seller profile info with products and reviews. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid seller id", 400);
    }

    await connectDB();
    const sellerId = new mongoose.Types.ObjectId(id);

    const user = await User.findOne({
      _id: sellerId,
      role: { $in: ["seller", "admin"] },
    })
      .select("fullName email createdAt profileImage shopName shopDescription")
      .lean();

    if (!user) return apiError("Seller not found", 404);

    const [products, soldAgg, reviews] = await Promise.all([
      Product.find({ sellerId, status: "active", isActive: { $ne: false } })
        .populate("gameId", "title")
        .populate("productCategoryId", "title")
        .sort({ createdAt: -1 })
        .lean(),
      Product.aggregate([
        { $match: { sellerId } },
        { $group: { _id: null, total: { $sum: "$totalSold" } } },
      ]),
      Review.find({ sellerId })
        .populate("buyerId", "fullName email")
        .populate("productId", "customTitle title")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const gameMap = new Map<string, string>();
    const formattedProducts = products.map((p) => {
      const gId = (p.gameId as { _id?: { toString(): string } })?._id?.toString?.() ?? "";
      const gTitle = (p.gameId as { title?: string })?.title ?? "";
      if (gId && gTitle) gameMap.set(gId, gTitle);
      return {
        id: p._id.toString(),
        customTitle: p.customTitle || p.title,
        gameId: gId,
        gameTitle: gTitle,
        categoryTitle: (p.productCategoryId as { title?: string })?.title ?? "",
        price: p.price,
        inStock: p.inStock,
        totalSold: p.totalSold ?? 0,
        deliveryTime: p.deliveryTime,
      };
    });

    const games = Array.from(gameMap.entries()).map(([gId, gTitle]) => ({
      id: gId,
      title: gTitle,
    }));

    const formattedReviews = reviews.map((r) => {
      const buyer = r.buyerId as { fullName?: string; email?: string } | undefined;
      const product = r.productId as { customTitle?: string; title?: string } | undefined;
      return {
        id: r._id.toString(),
        buyerName: buyer?.fullName || buyer?.email || "Buyer",
        productTitle: product?.customTitle || product?.title || "Product",
        rating: r.rating,
        text: r.text,
        reply: r.reply ?? null,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({
      seller: {
        id: user._id.toString(),
        name: user.fullName || user.email,
        shopName: user.shopName ?? "",
        shopDescription: user.shopDescription ?? "",
        profileImage: user.profileImage ?? "",
        createdAt: user.createdAt,
        totalProducts: products.length,
        totalSold: soldAgg[0]?.total ?? 0,
      },
      products: formattedProducts,
      games,
      reviews: formattedReviews,
    });
  } catch (err) {
    console.error("Seller profile error:", err);
    return apiError("Failed to load profile.", 500);
  }
}
