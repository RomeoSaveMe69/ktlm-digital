import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Game } from "@/lib/models/Game";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/seller/products – list current seller's products. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    if (
      !sellerIdStr ||
      !mongoose.Types.ObjectId.isValid(sellerIdStr) ||
      sellerIdStr.length !== 24
    ) {
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 }
      );
    }
    const sellerIdObj = new mongoose.Types.ObjectId(sellerIdStr);
    await connectDB();
    const rawProducts = await Product.find({ sellerId: sellerIdObj })
      .populate("gameId", "title image")
      .populate("productCategoryId", "title")
      .sort({ createdAt: -1 })
      .lean();

    const products = rawProducts.map((p) => ({
      id: p._id.toString(),
      customTitle: p.customTitle ?? p.title ?? "",
      gameId:
        (p.gameId as { _id?: { toString(): string } })?._id?.toString?.() ??
        p.gameId?.toString() ??
        "",
      gameTitle:
        (p.gameId as { title?: string })?.title ?? "Unknown Game",
      productCategoryId:
        (p.productCategoryId as { _id?: { toString(): string } })?._id?.toString?.() ??
        p.productCategoryId?.toString() ??
        "",
      categoryTitle:
        (p.productCategoryId as { title?: string })?.title ?? "",
      price: p.price,
      inStock: p.inStock,
      status: p.status,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Seller products list error:", err);
    return apiError("Failed to load products.", 500);
  }
}

/**
 * POST /api/seller/products – create a product listing.
 * Body: { gameId, productCategoryId, customTitle, price, inStock }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json(
        { error: "You must be logged in as a seller to add products." },
        { status: 403 }
      );
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    if (
      !sellerIdStr ||
      !mongoose.Types.ObjectId.isValid(sellerIdStr) ||
      sellerIdStr.length !== 24
    ) {
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const gameId = body.gameId != null ? String(body.gameId).trim() : "";
    const productCategoryId =
      body.productCategoryId != null
        ? String(body.productCategoryId).trim()
        : "";
    const customTitle =
      body.customTitle != null ? String(body.customTitle).trim() : "";
    const price = Number(body.price);
    const inStock = Number(body.inStock ?? 0);

    if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { error: "Please select a valid game." },
        { status: 400 }
      );
    }
    if (
      !productCategoryId ||
      !mongoose.Types.ObjectId.isValid(productCategoryId)
    ) {
      return NextResponse.json(
        { error: "Please select a valid product category." },
        { status: 400 }
      );
    }
    if (!customTitle) {
      return NextResponse.json(
        { error: "Custom title is required." },
        { status: 400 }
      );
    }
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be 0 or greater." },
        { status: 400 }
      );
    }
    if (Number.isNaN(inStock) || inStock < 0) {
      return NextResponse.json(
        { error: "Stock must be 0 or greater." },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify game and category exist and category belongs to game
    const [game, category] = await Promise.all([
      Game.findById(gameId).lean(),
      ProductCategory.findById(productCategoryId).lean(),
    ]);
    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }
    if (!category) {
      return NextResponse.json(
        { error: "Product category not found." },
        { status: 404 }
      );
    }
    if (category.gameId.toString() !== gameId) {
      return NextResponse.json(
        { error: "Category does not belong to selected game." },
        { status: 400 }
      );
    }

    const sellerIdObj = new mongoose.Types.ObjectId(sellerIdStr);
    const product = await Product.create({
      gameId: new mongoose.Types.ObjectId(gameId),
      sellerId: sellerIdObj,
      productCategoryId: new mongoose.Types.ObjectId(productCategoryId),
      customTitle,
      title: customTitle,
      price,
      inStock,
      deliveryTime: "5-15 min",
      status: "active",
    });

    return NextResponse.json({
      product: {
        id: product._id.toString(),
        customTitle: product.customTitle,
        gameId: product.gameId.toString(),
        productCategoryId: product.productCategoryId.toString(),
        price: product.price,
        inStock: product.inStock,
        status: product.status,
      },
    });
  } catch (err) {
    console.error("Seller product create error:", err);
    return apiError("Failed to create product. Please try again.", 500);
  }
}
