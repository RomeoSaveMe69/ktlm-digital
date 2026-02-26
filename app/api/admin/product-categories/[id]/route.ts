import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

/** PUT /api/admin/product-categories/[id] – update title. */
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
    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const cat = await ProductCategory.findByIdAndUpdate(
      id,
      { $set: { title } },
      { new: true }
    ).lean();
    if (!cat) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      category: {
        id: cat._id.toString(),
        gameId: cat.gameId.toString(),
        title: cat.title,
      },
    });
  } catch (err) {
    console.error("Admin product-category update error:", err);
    return apiError("Failed to update product category.", 500);
  }
}

/** DELETE /api/admin/product-categories/[id] – also deletes Products using this category. */
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
    const cat = await ProductCategory.findByIdAndDelete(id);
    if (!cat) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    await Product.deleteMany({ productCategoryId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin product-category delete error:", err);
    return apiError("Failed to delete product category.", 500);
  }
}
