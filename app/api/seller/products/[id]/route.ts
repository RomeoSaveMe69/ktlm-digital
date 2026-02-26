import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { SellerProductInfo } from "@/lib/models/SellerProductInfo";
import { SellerCurrency } from "@/lib/models/SellerCurrency";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET: Single product (seller own only). */
export async function GET(
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
        { error: "Invalid product id." },
        { status: 400 },
      );
    }
    await connectDB();
    const product = await Product.findOne({
      _id: id,
      sellerId: session.userId,
    })
      .populate("gameId", "title")
      .lean();
    if (!product)
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    return NextResponse.json({
      product: {
        id: product._id.toString(),
        gameId: (product.gameId as { _id: unknown })?.toString?.() ?? "",
        gameTitle: (product.gameId as { title?: string })?.title ?? "",
        title: product.title,
        customTitle: product.customTitle,
        price: product.price,
        inStock: product.inStock,
        deliveryTime: product.deliveryTime,
        status: product.status,
        pricingMode: product.pricingMode ?? "manual",
        sellerProductInfoId: product.sellerProductInfoId?.toString() ?? null,
        roundingTarget: product.roundingTarget ?? 0,
      },
    });
  } catch (err) {
    console.error("Seller product get error:", err);
    return apiError("Failed to load product.", 500);
  }
}

/**
 * PATCH: Update product (seller own only).
 * Supports both manual price edit and auto-pricing recalculation.
 */
export async function PATCH(
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
        { error: "Invalid product id." },
        { status: 400 },
      );
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    const body = await request.json();
    await connectDB();

    const update: Record<string, unknown> = {};

    if (body.customTitle != null)
      update.customTitle = String(body.customTitle).trim();
    if (body.title != null) update.title = String(body.title).trim();
    if (
      body.inStock != null &&
      typeof body.inStock === "number" &&
      body.inStock >= 0
    )
      update.inStock = body.inStock;
    if (body.deliveryTime != null)
      update.deliveryTime = String(body.deliveryTime).trim();
    if (body.status === "active" || body.status === "inactive")
      update.status = body.status;
    if (body.description != null)
      update.description = String(body.description).trim();
    if (Array.isArray(body.buyerInputs)) {
      update.buyerInputs = body.buyerInputs
        .filter((i: unknown) => i && typeof (i as Record<string, unknown>).label === "string")
        .map((i: { label: string; isRequired?: boolean }) => ({
          label: String(i.label).trim(),
          isRequired: i.isRequired !== false,
        }))
        .filter((i: { label: string }) => i.label.length > 0);
    }

    const pricingMode = body.pricingMode === "auto" ? "auto" : "manual";
    update.pricingMode = pricingMode;

    if (pricingMode === "auto") {
      const infoId = String(body.sellerProductInfoId ?? "").trim();
      const roundingTarget = Number(body.roundingTarget ?? 0);

      if (!infoId || !mongoose.Types.ObjectId.isValid(infoId)) {
        return NextResponse.json(
          { error: "SellerProductInfo is required for auto pricing." },
          { status: 400 },
        );
      }
      if (![0, 10, 50, 100].includes(roundingTarget)) {
        return NextResponse.json(
          { error: "Rounding target must be 0, 10, 50, or 100." },
          { status: 400 },
        );
      }
      const info = await SellerProductInfo.findOne({
        _id: new mongoose.Types.ObjectId(infoId),
        sellerId: new mongoose.Types.ObjectId(sellerIdStr),
      }).lean();
      if (!info) {
        return NextResponse.json(
          { error: "Product info not found." },
          { status: 404 },
        );
      }
      const currency = await SellerCurrency.findById(info.currencyId).lean();
      if (!currency) {
        return NextResponse.json(
          { error: "Currency not found." },
          { status: 404 },
        );
      }
      const rawCost = info.costAmount * currency.rate;
      const subTotal = rawCost + rawCost * (currency.profitMargin / 100);
      let finalPrice: number;
      if (roundingTarget <= 0) {
        finalPrice = Math.round(subTotal);
      } else {
        const remainder = subTotal % roundingTarget;
        finalPrice =
          remainder === 0 ? subTotal : subTotal + (roundingTarget - remainder);
      }
      update.price = finalPrice;
      update.sellerProductInfoId = new mongoose.Types.ObjectId(infoId);
      update.roundingTarget = roundingTarget;
    } else {
      if (
        body.price != null &&
        typeof body.price === "number" &&
        body.price >= 0
      ) {
        update.price = body.price;
      }
      update.sellerProductInfoId = null;
      update.roundingTarget = 0;
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, sellerId: session.userId },
      update,
      { new: true },
    );
    if (!product)
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    return NextResponse.json({
      product: {
        id: product._id.toString(),
        customTitle: product.customTitle,
        title: product.title,
        price: product.price,
        inStock: product.inStock,
        deliveryTime: product.deliveryTime,
        status: product.status,
        pricingMode: product.pricingMode,
        sellerProductInfoId: product.sellerProductInfoId?.toString() ?? null,
        roundingTarget: product.roundingTarget,
      },
    });
  } catch (err) {
    console.error("Seller product update error:", err);
    return apiError("Failed to update product.", 500);
  }
}

/** DELETE: Delete product (seller own only). */
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
        { error: "Invalid product id." },
        { status: 400 },
      );
    }
    await connectDB();
    const result = await Product.findOneAndDelete({
      _id: id,
      sellerId: session.userId,
    });
    if (!result)
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Seller product delete error:", err);
    return apiError("Failed to delete product.", 500);
  }
}
