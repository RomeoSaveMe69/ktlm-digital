import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SellerCurrency } from "@/lib/models/SellerCurrency";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/seller/currencies – list current seller's currencies. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    if (!sellerIdStr || !mongoose.Types.ObjectId.isValid(sellerIdStr)) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }
    await connectDB();
    const currencies = await SellerCurrency.find({
      sellerId: new mongoose.Types.ObjectId(sellerIdStr),
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      currencies: currencies.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        rate: c.rate,
        profitMargin: c.profitMargin,
      })),
    });
  } catch (err) {
    console.error("Seller currencies GET error:", err);
    return apiError("Failed to load currencies.", 500);
  }
}

/** POST /api/seller/currencies – create a currency. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    if (!sellerIdStr || !mongoose.Types.ObjectId.isValid(sellerIdStr)) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const rate = Number(body.rate);
    const profitMargin = Number(body.profitMargin ?? 0);

    if (!name) {
      return NextResponse.json(
        { error: "Currency name is required." },
        { status: 400 },
      );
    }
    if (isNaN(rate) || rate <= 0) {
      return NextResponse.json(
        { error: "Rate must be greater than 0." },
        { status: 400 },
      );
    }
    if (isNaN(profitMargin) || profitMargin < 0) {
      return NextResponse.json(
        { error: "Profit margin must be 0 or greater." },
        { status: 400 },
      );
    }

    await connectDB();
    const currency = await SellerCurrency.create({
      sellerId: new mongoose.Types.ObjectId(sellerIdStr),
      name,
      rate,
      profitMargin,
    });

    return NextResponse.json({
      currency: {
        id: currency._id.toString(),
        name: currency.name,
        rate: currency.rate,
        profitMargin: currency.profitMargin,
      },
    });
  } catch (err) {
    console.error("Seller currency create error:", err);
    return apiError("Failed to create currency.", 500);
  }
}
