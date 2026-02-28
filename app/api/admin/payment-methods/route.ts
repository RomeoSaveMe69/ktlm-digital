import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { PaymentMethod } from "@/lib/models/PaymentMethod";
import { uploadImage } from "@/lib/cloudinary";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/admin/payment-methods – list all payment methods. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const methods = await PaymentMethod.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      methods: methods.map((m) => ({
        id: m._id.toString(),
        type: m.type,
        methodName: m.methodName,
        accountName: m.accountName ?? null,
        accountNumber: m.accountNumber ?? null,
        shopName: m.shopName ?? null,
        qrImage: m.qrImage ?? null,
        isActive: m.isActive,
      })),
    });
  } catch (err) {
    console.error("Admin payment-methods GET error:", err);
    return apiError("Failed to load payment methods.", 500);
  }
}

/** POST /api/admin/payment-methods – create a payment method. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const type = body.type === "qr" ? "qr" : "account";
    const methodName = String(body.methodName ?? "").trim();

    if (!methodName) {
      return NextResponse.json(
        { error: "Method name is required." },
        { status: 400 },
      );
    }

    await connectDB();
    const data: Record<string, unknown> = { type, methodName };

    if (type === "account") {
      const accountName = String(body.accountName ?? "").trim();
      const accountNumber = String(body.accountNumber ?? "").trim();
      if (!accountName || !accountNumber) {
        return NextResponse.json(
          { error: "Account name and number are required." },
          { status: 400 },
        );
      }
      data.accountName = accountName;
      data.accountNumber = accountNumber;
    } else {
      const shopName = String(body.shopName ?? "").trim();
      const qrImageRaw = String(body.qrImage ?? "").trim();
      if (!shopName) {
        return NextResponse.json(
          { error: "Shop name is required." },
          { status: 400 },
        );
      }
      if (!qrImageRaw) {
        return NextResponse.json(
          { error: "QR image is required." },
          { status: 400 },
        );
      }
      data.shopName = shopName;
      data.qrImage = qrImageRaw.startsWith("data:")
        ? await uploadImage(qrImageRaw, "games")
        : qrImageRaw;
    }

    const method = await PaymentMethod.create(data);
    return NextResponse.json({
      method: {
        id: method._id.toString(),
        type: method.type,
        methodName: method.methodName,
        isActive: method.isActive,
      },
    });
  } catch (err) {
    console.error("Admin payment-method create error:", err);
    return apiError("Failed to create payment method.", 500);
  }
}
