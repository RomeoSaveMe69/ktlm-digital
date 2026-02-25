import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";
import { mapProductToSafeShape } from "@/lib/product-utils";

export const dynamic = "force-dynamic";

/** GET: List current user's products (seller only). Tolerates old schema. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    let rawProducts: unknown[] = [];
    try {
      rawProducts = await Product.find({ sellerId: session.userId })
        .populate("gameId", "title image")
        .sort({ createdAt: -1 })
        .lean();
    } catch (fetchErr) {
      console.error("Seller products fetch/populate error:", fetchErr);
      return NextResponse.json({ products: [] }, { status: 200 });
    }
    const products = (Array.isArray(rawProducts) ? rawProducts : []).map(
      (p: unknown) => {
        const row = mapProductToSafeShape(
          p as Parameters<typeof mapProductToSafeShape>[0],
        );
        const doc = p as Record<string, unknown>;
        return {
          ...row,
          gameId:
            (
              doc.gameId as { _id?: { toString(): string } }
            )?._id?.toString?.() ??
            (doc.gameId as unknown)?.toString?.() ??
            "",
          createdAt: doc.createdAt,
        };
      },
    );
    return NextResponse.json({ products });
  } catch (err) {
    console.error("Seller products list error:", err);
    return apiError("Failed to load products.", 500);
  }
}

/** POST: Create product (seller only). sellerId = current user's ID from session. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json(
        { error: "You must be logged in as a seller to add products." },
        { status: 403 },
      );
    }
    const body = await request.json();
    const gameId = body.gameId != null ? String(body.gameId).trim() : "";
    const title = body.title != null ? String(body.title).trim() : "";
    const price = Number(body.price);
    const inStock = Number(body.inStock);
    const deliveryTime =
      body.deliveryTime != null ? String(body.deliveryTime).trim() : "";

    if (!gameId || !title) {
      return NextResponse.json(
        { error: "Game and item title are required." },
        { status: 400 },
      );
    }
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { error: "Invalid game. Please select a game from the list." },
        { status: 400 },
      );
    }
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be a number greater than or equal to 0." },
        { status: 400 },
      );
    }
    if (Number.isNaN(inStock) || inStock < 0) {
      return NextResponse.json(
        { error: "In stock must be a number greater than or equal to 0." },
        { status: 400 },
      );
    }

    await connectDB();

    const sellerIdObj =
      mongoose.Types.ObjectId.isValid(session.userId) &&
      String(session.userId).length === 24
        ? new mongoose.Types.ObjectId(session.userId)
        : null;
    if (!sellerIdObj) {
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 },
      );
    }

    const product = await Product.create({
      gameId: new mongoose.Types.ObjectId(gameId),
      sellerId: sellerIdObj,
      title,
      price,
      inStock,
      deliveryTime: deliveryTime || "5-15 min",
      status: "active",
    });

    return NextResponse.json({
      product: {
        id: product._id.toString(),
        gameId: product.gameId.toString(),
        title: product.title,
        price: product.price,
        inStock: product.inStock,
        deliveryTime: product.deliveryTime,
        status: product.status,
      },
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to create product.";
    console.error("Seller product create error:", err);
    if (msg.includes("validation failed") || msg.includes("Cast to ObjectId")) {
      return NextResponse.json(
        { error: "Invalid data. Check game and fields." },
        { status: 400 },
      );
    }
    return apiError(
      msg.length > 80 ? "Failed to create product. Please try again." : msg,
      500,
    );
  }
}
