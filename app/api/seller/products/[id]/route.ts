import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

/** GET: Single product (seller own only). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product id." },
        { status: 400 },
      );
    }
    await connectDB();
    const product = await Product.findOne({
      _id: id,
      sellerId: session.userId,
    })
      .populate("gameId", "title")
      .lean();
    if (!product)
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    return NextResponse.json({
      product: {
        id: product._id.toString(),
        gameId: (product.gameId as { _id: unknown })?.toString?.() ?? "",
        gameTitle: (product.gameId as { title?: string })?.title ?? "",
        title: product.title,
        price: product.price,
        inStock: product.inStock,
        deliveryTime: product.deliveryTime,
        status: product.status,
      },
    });
  } catch (err) {
    console.error("Seller product get error:", err);
    return apiError("Failed to load product.", 500);
  }
}

/** PATCH: Update product (seller own only). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product id." },
        { status: 400 },
      );
    }
    const body = await request.json();
    await connectDB();
    const update: Record<string, unknown> = {};
    if (body.title != null) update.title = String(body.title).trim();
    if (body.price != null && typeof body.price === "number" && body.price >= 0)
      update.price = body.price;
    if (
      body.inStock != null &&
      typeof body.inStock === "number" &&
      body.inStock >= 0
    )
      update.inStock = body.inStock;
    if (body.deliveryTime != null)
      update.deliveryTime = String(body.deliveryTime).trim();
    if (body.status === "active" || body.status === "inactive")
      update.status = body.status;
    const product = await Product.findOneAndUpdate(
      { _id: id, sellerId: session.userId },
      update,
      { new: true },
    );
    if (!product)
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    return NextResponse.json({
      product: {
        id: product._id.toString(),
        title: product.title,
        price: product.price,
        inStock: product.inStock,
        deliveryTime: product.deliveryTime,
        status: product.status,
      },
    });
  } catch (err) {
    console.error("Seller product update error:", err);
    return apiError("Failed to update product.", 500);
  }
}

/** DELETE: Delete product (seller own only). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product id." },
        { status: 400 },
      );
    }
    await connectDB();
    const result = await Product.findOneAndDelete({
      _id: id,
      sellerId: session.userId,
    });
    if (!result)
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Seller product delete error:", err);
    return apiError("Failed to delete product.", 500);
  }
}
