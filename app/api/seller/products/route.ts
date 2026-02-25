import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

/** GET: List current user's products (seller only). */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const products = await Product.find({ sellerId: session.userId })
      .populate("gameId", "title image")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      products: products.map((p) => ({
        id: p._id.toString(),
        gameId:
          (p.gameId as { _id: unknown })?.toString?.() ??
          p.gameId?.toString?.() ??
          "",
        gameTitle: (p.gameId as { title?: string })?.title ?? "",
        title: p.title,
        price: p.price,
        inStock: p.inStock,
        deliveryTime: p.deliveryTime,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("Seller products list error:", err);
    return apiError("Failed to load products.", 500);
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
    const { gameId, title, price, inStock, deliveryTime } = body;
    if (
      !gameId ||
      !title ||
      typeof price !== "number" ||
      price < 0 ||
      typeof inStock !== "number" ||
      inStock < 0
    ) {
      return NextResponse.json(
        {
          error:
            "gameId, title, price (number >= 0), and inStock (number >= 0) are required.",
        },
        { status: 400 },
      );
    }
    await connectDB();
    const product = await Product.create({
      gameId,
      sellerId: session.userId,
      title: String(title).trim(),
      price: Number(price),
      inStock: Number(inStock),
      deliveryTime: deliveryTime ? String(deliveryTime).trim() : "5-15 min",
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
    console.error("Seller product create error:", err);
    return apiError("Failed to create product.", 500);
  }
}
