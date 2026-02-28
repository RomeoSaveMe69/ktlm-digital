import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";
import "@/lib/models/Game";
import "@/lib/models/ProductCategory";

export const dynamic = "force-dynamic";

/** GET /api/seller/products – list current seller's products. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    await connectDB();

    const products = await Product.find({
      sellerId: new mongoose.Types.ObjectId(session.userId),
    })
      .populate("gameId", "title")
      .populate("productCategoryId", "title")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      products: products.map((p) => ({
        id: p._id.toString(),
        customTitle: p.customTitle || p.title,
        gameTitle: (p.gameId as { title?: string })?.title ?? "",
        categoryTitle: (p.productCategoryId as { title?: string })?.title ?? "",
        price: p.price,
        inStock: p.inStock,
        status: p.status,
        isActive: p.isActive !== false,
        totalSold: p.totalSold ?? 0,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("Seller products GET error:", err);
    return apiError("Failed to load products.", 500);
  }
}

/**
 * PATCH /api/seller/products
 * Body: { productId, isActive: boolean }
 * Toggle product visibility.
 */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    const { productId, isActive } = await request.json();
    if (!productId || typeof isActive !== "boolean") {
      return apiError("productId and isActive (boolean) are required.", 400);
    }

    await connectDB();

    const product = await Product.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(productId),
        sellerId: new mongoose.Types.ObjectId(session.userId),
      },
      { $set: { isActive } },
      { new: true },
    );

    if (!product) return apiError("Product not found.", 404);

    return NextResponse.json({ ok: true, isActive: product.isActive });
  } catch (err) {
    console.error("Seller product toggle error:", err);
    return apiError("Failed to update product.", 500);
  }
}
