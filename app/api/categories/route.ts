import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/categories?gameId= – list product categories for a game (public). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId") ?? "";
    if (!gameId) {
      return NextResponse.json({ categories: [] });
    }
    await connectDB();
    const cats = await ProductCategory.find({ gameId }).sort({ title: 1 }).lean();
    return NextResponse.json({
      categories: cats.map((c) => ({
        id: c._id.toString(),
        title: c.title,
      })),
    });
  } catch (err) {
    console.error("Categories list error:", err);
    return apiError("Failed to load categories.", 500);
  }
}
