import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { PaymentMethod } from "@/lib/models/PaymentMethod";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** PUT /api/admin/payment-methods/[id] – update a payment method. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const body = await request.json();
    await connectDB();

    const update: Record<string, unknown> = {};
    if (body.methodName != null) update.methodName = String(body.methodName).trim();
    if (body.accountName != null) update.accountName = String(body.accountName).trim();
    if (body.accountNumber != null) update.accountNumber = String(body.accountNumber).trim();
    if (body.shopName != null) update.shopName = String(body.shopName).trim();
    if (body.qrImage != null) update.qrImage = String(body.qrImage);
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;

    const method = await PaymentMethod.findByIdAndUpdate(id, update, { new: true });
    if (!method) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({
      method: {
        id: method._id.toString(),
        type: method.type,
        methodName: method.methodName,
        accountName: method.accountName ?? null,
        accountNumber: method.accountNumber ?? null,
        shopName: method.shopName ?? null,
        qrImage: method.qrImage ?? null,
        isActive: method.isActive,
      },
    });
  } catch (err) {
    console.error("Admin payment-method update error:", err);
    return apiError("Failed to update payment method.", 500);
  }
}

/** DELETE /api/admin/payment-methods/[id] – delete a payment method. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }
    await connectDB();
    const result = await PaymentMethod.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin payment-method delete error:", err);
    return apiError("Failed to delete payment method.", 500);
  }
}
