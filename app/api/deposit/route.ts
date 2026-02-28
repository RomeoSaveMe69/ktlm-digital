import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { DepositRequest } from "@/lib/models/DepositRequest";
import { PaymentMethod } from "@/lib/models/PaymentMethod";
import { uploadImage } from "@/lib/cloudinary";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** POST /api/deposit – submit a deposit request. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Please log in to make a deposit." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);
    const paymentMethodId = String(body.paymentMethodId ?? "").trim();
    const transactionId = String(body.transactionId ?? "").trim();
    const screenshot = body.screenshot ? String(body.screenshot) : undefined;

    if (isNaN(amount) || amount < 1) {
      return NextResponse.json(
        { error: "Amount must be at least 1." },
        { status: 400 },
      );
    }
    if (!paymentMethodId || !mongoose.Types.ObjectId.isValid(paymentMethodId)) {
      return NextResponse.json(
        { error: "Valid payment method is required." },
        { status: 400 },
      );
    }
    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const method = await PaymentMethod.findOne({
      _id: new mongoose.Types.ObjectId(paymentMethodId),
      isActive: true,
    }).lean();
    if (!method) {
      return NextResponse.json(
        { error: "Payment method not found." },
        { status: 404 },
      );
    }

    let screenshotUrl: string | undefined;
    if (screenshot) {
      try {
        screenshotUrl = await uploadImage(screenshot, "deposits");
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        console.error("Cloudinary upload failed:", msg);
        return apiError(`Screenshot upload failed: ${msg}`, 500);
      }
    }

    const deposit = await DepositRequest.create({
      userId: new mongoose.Types.ObjectId(String(session.userId)),
      amount,
      paymentMethodId: new mongoose.Types.ObjectId(paymentMethodId),
      transactionId,
      screenshot: screenshotUrl,
      status: "pending",
    });

    return NextResponse.json({
      deposit: {
        id: deposit._id.toString(),
        amount: deposit.amount,
        status: deposit.status,
      },
    });
  } catch (err) {
    console.error("Deposit create error:", err);
    return apiError("Failed to submit deposit request.", 500);
  }
}

/** GET /api/deposit – list current user's deposit requests. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const deposits = await DepositRequest.find({
      userId: new mongoose.Types.ObjectId(String(session.userId)),
    })
      .populate("paymentMethodId", "methodName type")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      deposits: deposits.map((d) => ({
        id: d._id.toString(),
        amount: d.amount,
        transactionId: d.transactionId,
        status: d.status,
        methodName:
          (d.paymentMethodId as { methodName?: string })?.methodName ?? "",
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    console.error("Deposit list error:", err);
    return apiError("Failed to load deposit history.", 500);
  }
}
