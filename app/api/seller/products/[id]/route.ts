import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";

/** GET: Single product (seller own only) */
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
    }).lean();
    if (!product)
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    return NextResponse.json({
      product: {
        id: product._id.toString(),
        name: product.name,
        gameName: product.gameName,
        priceMmk: product.priceMmk,
        fulfillmentType: product.fulfillmentType,
        isActive: product.isActive,
      },
    });
  } catch (err) {
    console.error("Seller product get error:", err);
    return NextResponse.json(
      { error: "Failed to load product." },
      { status: 500 },
    );
  }
}

/** PATCH: Update product (seller own only) */
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
    const product = await Product.findOneAndUpdate(
      { _id: id, sellerId: session.userId },
      {
        ...(body.name != null && { name: String(body.name).trim() }),
        ...(body.gameName != null && {
          gameName: String(body.gameName).trim(),
        }),
        ...(typeof body.priceMmk === "number" &&
          body.priceMmk >= 0 && { priceMmk: body.priceMmk }),
        ...(body.fulfillmentType != null && {
          fulfillmentType: body.fulfillmentType === "api" ? "api" : "manual",
        }),
        ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
      },
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
        name: product.name,
        gameName: product.gameName,
        priceMmk: product.priceMmk,
        fulfillmentType: product.fulfillmentType,
        isActive: product.isActive,
      },
    });
  } catch (err) {
    console.error("Seller product update error:", err);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 },
    );
  }
}

/** DELETE: Delete product (seller own only) */
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
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 },
    );
  }
}
