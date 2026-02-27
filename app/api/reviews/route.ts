import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { Order } from "@/lib/models/Order";
import { apiError } from "@/lib/api-utils";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews?productId=xxx
 * Public: returns reviews for a product with buyer names.
 */
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId");
    if (!productId) return apiError("productId is required", 400);

    await connectDB();
    const reviews = await Review.find({ productId })
      .populate("buyerId", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      reviews: reviews.map((r) => {
        const buyer = r.buyerId as { fullName?: string; email?: string } | undefined;
        return {
          id: r._id.toString(),
          buyerName: buyer?.fullName || buyer?.email || "Buyer",
          rating: r.rating,
          text: r.text,
          reply: r.reply ?? null,
          createdAt: r.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error("Reviews GET error:", err);
    return apiError("Failed to load reviews.", 500);
  }
}

/**
 * POST /api/reviews
 * Body: { orderId, rating, text }
 * Buyer submits a review for a completed order. One review per order.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);

    const body = await request.json();
    const { orderId, rating, text } = body;

    if (!orderId || !rating || !text?.trim()) {
      return apiError("orderId, rating, and text are required.", 400);
    }
    if (rating < 1 || rating > 5) return apiError("Rating must be 1-5.", 400);

    await connectDB();

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      buyerId: new mongoose.Types.ObjectId(session.userId),
      status: "completed",
    });
    if (!order) return apiError("Completed order not found.", 404);

    const existing = await Review.findOne({ orderId: order._id });
    if (existing) return apiError("You already reviewed this order.", 400);

    const review = await Review.create({
      productId: order.productId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      orderId: order._id,
      rating: Math.round(rating),
      text: text.trim(),
    });

    return NextResponse.json({
      ok: true,
      review: {
        id: review._id.toString(),
        rating: review.rating,
        text: review.text,
      },
    });
  } catch (err) {
    console.error("Review POST error:", err);
    return apiError("Failed to submit review.", 500);
  }
}
