import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";

/** GET: List current user's products (seller only) */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const products = await Product.find({ sellerId: session.userId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        gameName: p.gameName,
        priceMmk: p.priceMmk,
        fulfillmentType: p.fulfillmentType,
        isActive: p.isActive,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("Seller products list error:", err);
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}

/** POST: Create product (seller only). sellerId = current user. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { name, gameName, priceMmk, fulfillmentType } = body;
    if (!name || !gameName || typeof priceMmk !== "number" || priceMmk < 0) {
      return NextResponse.json(
        { error: "name, gameName and priceMmk (number >= 0) are required." },
        { status: 400 }
      );
    }
    await connectDB();
    const product = await Product.create({
      sellerId: session.userId,
      name: String(name).trim(),
      gameName: String(gameName).trim(),
      priceMmk: Number(priceMmk),
      fulfillmentType: fulfillmentType === "api" ? "api" : "manual",
      isActive: true,
    });
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
    console.error("Seller product create error:", err);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
