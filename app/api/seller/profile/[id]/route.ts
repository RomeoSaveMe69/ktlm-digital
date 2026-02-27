import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/seller/profile/[id] – public seller profile info. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid seller id", 400);
    }

    await connectDB();
    const user = await User.findOne({
      _id: id,
      role: { $in: ["seller", "admin"] },
    })
      .select("fullName email createdAt")
      .lean();

    if (!user) return apiError("Seller not found", 404);

    const [totalProducts, soldAgg] = await Promise.all([
      Product.countDocuments({ sellerId: id, status: "active" }),
      Product.aggregate([
        { $match: { sellerId: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, total: { $sum: "$totalSold" } } },
      ]),
    ]);

    return NextResponse.json({
      seller: {
        id: user._id.toString(),
        name: user.fullName || user.email,
        createdAt: user.createdAt,
        totalProducts,
        totalSold: soldAgg[0]?.total ?? 0,
      },
    });
  } catch (err) {
    console.error("Seller profile error:", err);
    return apiError("Failed to load profile.", 500);
  }
}
