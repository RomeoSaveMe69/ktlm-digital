import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

/** PATCH: Update any product (admin only). New schema: title, price, inStock, deliveryTime, status. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
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
    const update: Record<string, unknown> = {};
    if (body.title != null) update.title = String(body.title).trim();
    if (typeof body.price === "number" && body.price >= 0)
      update.price = body.price;
    if (typeof body.inStock === "number" && body.inStock >= 0)
      update.inStock = body.inStock;
    if (body.deliveryTime != null)
      update.deliveryTime = String(body.deliveryTime).trim();
    if (body.status === "active" || body.status === "inactive")
      update.status = body.status;
    await connectDB();
    const product = await Product.findByIdAndUpdate(id, update, { new: true });
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
    console.error("Admin product update error:", err);
    return apiError("Failed to update product.", 500);
  }
}

/** DELETE: Delete any product (admin only). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
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
    const result = await Product.findByIdAndDelete(id);
    if (!result)
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin product delete error:", err);
    return apiError("Failed to delete product.", 500);
  }
}
