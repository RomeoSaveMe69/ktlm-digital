import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { apiError } from "@/lib/api-utils";

/**
 * GET /api/seller/product-categories?gameId=
 * Returns product categories for a given game. Used by sellers when building a product listing.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json({ categories: [] });
    }
    const categories = await ProductCategory.find({
      gameId: new mongoose.Types.ObjectId(gameId),
    })
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c._id.toString(),
        gameId: c.gameId.toString(),
        title: c.title,
      })),
    });
  } catch (err) {
    console.error("Seller product-categories list error:", err);
    return apiError("Failed to load categories.", 500);
  }
}
