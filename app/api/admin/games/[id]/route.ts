import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/Game";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

/** GET /api/admin/games/[id] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const game = await Game.findById(id).lean();
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json({
      game: {
        id: game._id.toString(),
        name: game.title,
        title: game.title,
        description: game.description ?? "",
        image: game.image ?? null,
      },
    });
  } catch (err) {
    console.error("Admin game get error:", err);
    return apiError("Failed to load game.", 500);
  }
}

/** PUT /api/admin/games/[id] – update. Body: { title?, description?, image? } */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const body = await request.json();
    const updates: { title?: string; description?: string; image?: string } = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string")
      updates.description = body.description.trim();
    if (typeof body.image === "string") updates.image = body.image;
    const game = await Game.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json({
      game: {
        id: game._id.toString(),
        name: game.title,
        title: game.title,
        description: game.description ?? "",
        image: game.image ?? null,
      },
    });
  } catch (err) {
    console.error("Admin game update error:", err);
    return apiError("Failed to update game.", 500);
  }
}

/**
 * DELETE /api/admin/games/[id]
 * Cascade: game → all its ProductCategories → all Products in those categories.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const game = await Game.findByIdAndDelete(id);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    // Cascade: collect category IDs then delete products, then categories
    const cats = await ProductCategory.find({ gameId: id }, "_id").lean();
    const catIds = cats.map((c) => c._id);
    if (catIds.length > 0) {
      await Product.deleteMany({ productCategoryId: { $in: catIds } });
    }
    await ProductCategory.deleteMany({ gameId: id });
    // Also delete any products directly tied to this game
    await Product.deleteMany({ gameId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin game delete error:", err);
    return apiError("Failed to delete game.", 500);
  }
}
