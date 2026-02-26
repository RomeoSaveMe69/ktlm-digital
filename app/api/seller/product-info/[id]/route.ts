import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SellerProductInfo } from "@/lib/models/SellerProductInfo";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** DELETE /api/seller/product-info/[id] – delete a product info entry. */
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
        { error: "Invalid product info id." },
        { status: 400 },
      );
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    await connectDB();
    const result = await SellerProductInfo.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      sellerId: new mongoose.Types.ObjectId(sellerIdStr),
    });
    if (!result) {
      return NextResponse.json(
        { error: "Product info not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Seller product-info delete error:", err);
    return apiError("Failed to delete product info.", 500);
  }
}
