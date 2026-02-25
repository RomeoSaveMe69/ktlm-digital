import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

/** GET: List all products (admin only). New schema: gameId, title, price, inStock, deliveryTime, status. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const products = await Product.find()
      .populate("sellerId", "email fullName role")
      .populate("gameId", "title")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      products: products.map((p) => ({
        id: p._id.toString(),
        gameId: (p.gameId as { _id?: unknown })?.toString?.() ?? "",
        gameTitle: (p.gameId as { title?: string })?.title ?? "",
        title: p.title,
        price: p.price,
        inStock: p.inStock,
        deliveryTime: p.deliveryTime,
        status: p.status,
        createdAt: p.createdAt,
        seller: p.sellerId
          ? {
              id: (p.sellerId as { _id?: unknown })?._id?.toString?.() ?? "",
              email: (p.sellerId as { email?: string }).email,
              fullName: (p.sellerId as { fullName?: string }).fullName,
              role: (p.sellerId as { role?: string }).role,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("Admin products list error:", err);
    return apiError("Failed to load products.", 500);
  }
}
