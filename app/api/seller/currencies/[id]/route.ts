import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SellerCurrency } from "@/lib/models/SellerCurrency";
import { SellerProductInfo } from "@/lib/models/SellerProductInfo";
import { Product } from "@/lib/models/Product";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * Recalculate the auto-price for a single product given currency data.
 * Formula:
 *   rawCost = costAmount * rate
 *   subTotal = rawCost + rawCost * (profitMargin / 100)
 *   remainder = subTotal % roundingTarget  (if roundingTarget > 0)
 *   finalPrice = remainder === 0 ? subTotal : subTotal + (roundingTarget - remainder)
 */
function calcAutoPrice(
  costAmount: number,
  rate: number,
  profitMargin: number,
  roundingTarget: number,
): number {
  const rawCost = costAmount * rate;
  const subTotal = rawCost + rawCost * (profitMargin / 100);
  if (roundingTarget <= 0) return Math.round(subTotal);
  const remainder = subTotal % roundingTarget;
  return remainder === 0 ? subTotal : subTotal + (roundingTarget - remainder);
}

/** PUT /api/seller/currencies/[id] – update currency and cascade-reprice products. */
export async function PUT(
  request: Request,
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
        { error: "Invalid currency id." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const name = body.name != null ? String(body.name).trim() : undefined;
    const rate = body.rate != null ? Number(body.rate) : undefined;
    const profitMargin =
      body.profitMargin != null ? Number(body.profitMargin) : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: "Currency name cannot be empty." },
        { status: 400 },
      );
    }
    if (rate !== undefined && (isNaN(rate) || rate <= 0)) {
      return NextResponse.json(
        { error: "Rate must be greater than 0." },
        { status: 400 },
      );
    }
    if (
      profitMargin !== undefined &&
      (isNaN(profitMargin) || profitMargin < 0)
    ) {
      return NextResponse.json(
        { error: "Profit margin must be 0 or greater." },
        { status: 400 },
      );
    }

    await connectDB();

    const sellerIdStr = String(session.userId ?? "").trim();
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (rate !== undefined) update.rate = rate;
    if (profitMargin !== undefined) update.profitMargin = profitMargin;

    const currency = await SellerCurrency.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        sellerId: new mongoose.Types.ObjectId(sellerIdStr),
      },
      update,
      { new: true },
    );
    if (!currency) {
      return NextResponse.json(
        { error: "Currency not found." },
        { status: 404 },
      );
    }

    // ── Cascade Update: reprice all auto-priced products using this currency ──
    // Only reprice if rate or profitMargin changed.
    if (rate !== undefined || profitMargin !== undefined) {
      const newRate = currency.rate;
      const newMargin = currency.profitMargin;

      // Find all SellerProductInfos using this currency
      const infos = await SellerProductInfo.find({
        currencyId: currency._id,
        sellerId: new mongoose.Types.ObjectId(sellerIdStr),
      }).lean();

      for (const info of infos) {
        // Find all auto-priced products referencing this info
        const products = await Product.find({
          sellerProductInfoId: info._id,
          pricingMode: "auto",
        }).lean();

        for (const product of products) {
          const newPrice = calcAutoPrice(
            info.costAmount,
            newRate,
            newMargin,
            product.roundingTarget ?? 0,
          );
          await Product.findByIdAndUpdate(product._id, { price: newPrice });
        }
      }
    }

    return NextResponse.json({
      currency: {
        id: currency._id.toString(),
        name: currency.name,
        rate: currency.rate,
        profitMargin: currency.profitMargin,
      },
    });
  } catch (err) {
    console.error("Seller currency update error:", err);
    return apiError("Failed to update currency.", 500);
  }
}

/** DELETE /api/seller/currencies/[id] – delete a currency. */
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
        { error: "Invalid currency id." },
        { status: 400 },
      );
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    await connectDB();
    const result = await SellerCurrency.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      sellerId: new mongoose.Types.ObjectId(sellerIdStr),
    });
    if (!result) {
      return NextResponse.json(
        { error: "Currency not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Seller currency delete error:", err);
    return apiError("Failed to delete currency.", 500);
  }
}
