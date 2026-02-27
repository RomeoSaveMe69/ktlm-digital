import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { apiError } from "@/lib/api-utils";
import "@/lib/models/User";
import "@/lib/models/Product";

export const dynamic = "force-dynamic";

/** GET /api/seller/reviews – list all reviews for the current seller. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const reviews = await Review.find({
      sellerId: new mongoose.Types.ObjectId(session.userId),
    })
      .populate("buyerId", "fullName email")
      .populate("productId", "customTitle title")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      reviews: reviews.map((r) => {
        const buyer = r.buyerId as { fullName?: string; email?: string } | undefined;
        const product = r.productId as { customTitle?: string; title?: string } | undefined;
        return {
          id: r._id.toString(),
          buyerName: buyer?.fullName || buyer?.email || "Buyer",
          productTitle: product?.customTitle || product?.title || "Product",
          rating: r.rating,
          text: r.text,
          reply: r.reply ?? null,
          createdAt: r.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error("Seller reviews GET error:", err);
    return apiError("Failed to load reviews.", 500);
  }
}

/**
 * PATCH /api/seller/reviews
 * Body: { reviewId, reply }
 * Seller replies to a specific review.
 */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    const { reviewId, reply } = await request.json();
    if (!reviewId || !reply?.trim()) {
      return apiError("reviewId and reply are required.", 400);
    }

    await connectDB();
    const review = await Review.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(reviewId),
        sellerId: new mongoose.Types.ObjectId(session.userId),
      },
      { $set: { reply: reply.trim() } },
      { new: true },
    );

    if (!review) return apiError("Review not found.", 404);

    return NextResponse.json({ ok: true, reply: review.reply });
  } catch (err) {
    console.error("Seller review reply error:", err);
    return apiError("Failed to submit reply.", 500);
  }
}
