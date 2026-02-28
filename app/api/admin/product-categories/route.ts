import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { apiError } from "@/lib/api-utils";

/** GET /api/admin/product-categories?gameId= – list all or by gameId. */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const query =
      gameId && mongoose.Types.ObjectId.isValid(gameId)
        ? { gameId: new mongoose.Types.ObjectId(gameId) }
        : {};
    const categories = await ProductCategory.find(query)
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c._id.toString(),
        gameId: c.gameId.toString(),
        title: c.title,
        image: c.image ?? "",
      })),
    });
  } catch (err) {
    console.error("Admin product-categories list error:", err);
    return apiError("Failed to load product categories.", 500);
  }
}

/** POST /api/admin/product-categories – create. Body: { gameId, title } */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await request.json();
    const gameId = body.gameId;
    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { error: "Valid gameId is required" },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const doc = await ProductCategory.create({
      gameId: new mongoose.Types.ObjectId(gameId),
      title,
      ...(image && { image }),
    });
    return NextResponse.json({
      category: {
        id: doc._id.toString(),
        gameId: doc.gameId.toString(),
        title: doc.title,
        image: doc.image ?? "",
      },
    });
  } catch (err) {
    console.error("Admin product-categories create error:", err);
    return apiError("Failed to create product category.", 500);
  }
}
