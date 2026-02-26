import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PaymentMethod } from "@/lib/models/PaymentMethod";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/payment-methods – public list of active payment methods (for deposit page). */
export async function GET() {
  try {
    await connectDB();
    const methods = await PaymentMethod.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      methods: methods.map((m) => ({
        id: m._id.toString(),
        type: m.type,
        methodName: m.methodName,
        accountName: m.accountName ?? null,
        accountNumber: m.accountNumber ?? null,
        shopName: m.shopName ?? null,
        qrImage: m.qrImage ?? null,
      })),
    });
  } catch (err) {
    console.error("Payment methods public GET error:", err);
    return apiError("Failed to load payment methods.", 500);
  }
}
