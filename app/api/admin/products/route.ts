import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";
import { mapProductToSafeShape } from "@/lib/product-utils";

/** GET: List all products (admin only). Tolerates old schema (name, gameName, priceMmk, isActive). */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    let rawProducts: unknown[] = [];
    try {
      rawProducts = await Product.find()
        .populate("sellerId", "email fullName role")
        .populate("gameId", "title")
        .sort({ createdAt: -1 })
        .lean();
    } catch (fetchErr) {
      console.error("Admin products fetch/populate error:", fetchErr);
      return NextResponse.json({ products: [] }, { status: 200 });
    }
    const products = (Array.isArray(rawProducts) ? rawProducts : []).map(
      (p: unknown) => {
        const row = mapProductToSafeShape(
          p as Parameters<typeof mapProductToSafeShape>[0],
        );
        const doc = p as Record<string, unknown> & { sellerId?: unknown };
        const seller = doc.sellerId as
          | { _id?: unknown; email?: string; fullName?: string; role?: string }
          | null
          | undefined;
        return {
          ...row,
          seller: seller
            ? {
                id: seller._id?.toString?.() ?? "",
                email: seller.email,
                fullName: seller.fullName,
                role: seller.role,
              }
            : null,
        };
      },
    );
    return NextResponse.json({ products });
  } catch (err) {
    console.error("Admin products list error:", err);
    return apiError("Failed to load products.", 500);
  }
}
