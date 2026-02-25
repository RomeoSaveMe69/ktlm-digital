import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";

/** GET: List all products (admin only) */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const products = await Product.find()
      .populate("sellerId", "email fullName role")
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
        seller: p.sellerId
          ? {
              id: (p.sellerId as { _id: unknown })._id?.toString?.() ?? "",
              email: (p.sellerId as { email?: string }).email,
              fullName: (p.sellerId as { fullName?: string }).fullName,
              role: (p.sellerId as { role?: string }).role,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("Admin products list error:", err);
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}
