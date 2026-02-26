import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Game } from "@/lib/models/Game";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { SellerProductInfo } from "@/lib/models/SellerProductInfo";
import { SellerCurrency } from "@/lib/models/SellerCurrency";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/seller/products?gameId=... – list current seller's products, optional game filter. */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    if (
      !sellerIdStr ||
      !mongoose.Types.ObjectId.isValid(sellerIdStr) ||
      sellerIdStr.length !== 24
    ) {
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId") ?? "";

    const sellerIdObj = new mongoose.Types.ObjectId(sellerIdStr);
    await connectDB();

    const query: Record<string, unknown> = { sellerId: sellerIdObj };
    if (gameId && mongoose.Types.ObjectId.isValid(gameId)) {
      query.gameId = new mongoose.Types.ObjectId(gameId);
    }

    const rawProducts = await Product.find(query)
      .populate("gameId", "title image")
      .populate("productCategoryId", "title")
      .sort({ createdAt: -1 })
      .lean();

    const products = rawProducts.map((p) => ({
      id: p._id.toString(),
      customTitle: p.customTitle ?? p.title ?? "",
      gameId:
        (p.gameId as { _id?: { toString(): string } })?._id?.toString?.() ??
        p.gameId?.toString() ??
        "",
      gameTitle: (p.gameId as { title?: string })?.title ?? "Unknown Game",
      productCategoryId:
        (
          p.productCategoryId as { _id?: { toString(): string } }
        )?._id?.toString?.() ??
        p.productCategoryId?.toString() ??
        "",
      categoryTitle: (p.productCategoryId as { title?: string })?.title ?? "",
      price: p.price,
      inStock: p.inStock,
      status: p.status,
      pricingMode: p.pricingMode ?? "manual",
      sellerProductInfoId: p.sellerProductInfoId?.toString() ?? null,
      roundingTarget: p.roundingTarget ?? 0,
      description: p.description ?? "",
      buyerInputs: p.buyerInputs ?? [],
      totalSold: p.totalSold ?? 0,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Seller products list error:", err);
    return apiError("Failed to load products.", 500);
  }
}

/**
 * POST /api/seller/products – create a product listing.
 * Body (manual): { gameId, productCategoryId, customTitle, price, inStock, pricingMode:"manual" }
 * Body (auto):   { gameId, productCategoryId, customTitle, inStock, pricingMode:"auto",
 *                  sellerProductInfoId, roundingTarget }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json(
        { error: "You must be logged in as a seller to add products." },
        { status: 403 },
      );
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    if (
      !sellerIdStr ||
      !mongoose.Types.ObjectId.isValid(sellerIdStr) ||
      sellerIdStr.length !== 24
    ) {
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const gameId = String(body.gameId ?? "").trim();
    const productCategoryId = String(body.productCategoryId ?? "").trim();
    const customTitle = String(body.customTitle ?? "").trim();
    const inStock = Number(body.inStock ?? 0);
    const pricingMode = body.pricingMode === "auto" ? "auto" : "manual";
    const description = String(body.description ?? "").trim();
    const buyerInputs = Array.isArray(body.buyerInputs)
      ? body.buyerInputs
          .filter((i: unknown) => i && typeof (i as Record<string, unknown>).label === "string")
          .map((i: { label: string; isRequired?: boolean }) => ({
            label: String(i.label).trim(),
            isRequired: i.isRequired !== false,
          }))
          .filter((i: { label: string }) => i.label.length > 0)
      : [];

    if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { error: "Please select a valid game." },
        { status: 400 },
      );
    }
    if (
      !productCategoryId ||
      !mongoose.Types.ObjectId.isValid(productCategoryId)
    ) {
      return NextResponse.json(
        { error: "Please select a valid product category." },
        { status: 400 },
      );
    }
    if (!customTitle) {
      return NextResponse.json(
        { error: "Custom title is required." },
        { status: 400 },
      );
    }
    if (isNaN(inStock) || inStock < 0) {
      return NextResponse.json(
        { error: "Stock must be 0 or greater." },
        { status: 400 },
      );
    }

    await connectDB();

    const [game, category] = await Promise.all([
      Game.findById(gameId).lean(),
      ProductCategory.findById(productCategoryId).lean(),
    ]);
    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }
    if (!category || category.gameId.toString() !== gameId) {
      return NextResponse.json(
        { error: "Category does not belong to selected game." },
        { status: 400 },
      );
    }

    let finalPrice = 0;
    let sellerProductInfoId: mongoose.Types.ObjectId | undefined;
    let roundingTarget = 0;

    if (pricingMode === "auto") {
      const infoId = String(body.sellerProductInfoId ?? "").trim();
      roundingTarget = Number(body.roundingTarget ?? 0);
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
      if (roundingTarget <= 0) {
        finalPrice = Math.round(subTotal);
      } else {
        const remainder = subTotal % roundingTarget;
        finalPrice =
          remainder === 0 ? subTotal : subTotal + (roundingTarget - remainder);
      }
      sellerProductInfoId = new mongoose.Types.ObjectId(infoId);
    } else {
      const price = Number(body.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: "Price must be 0 or greater." },
          { status: 400 },
        );
      }
      finalPrice = price;
    }

    const sellerIdObj = new mongoose.Types.ObjectId(sellerIdStr);
    const product = await Product.create({
      gameId: new mongoose.Types.ObjectId(gameId),
      sellerId: sellerIdObj,
      productCategoryId: new mongoose.Types.ObjectId(productCategoryId),
      customTitle,
      title: customTitle,
      price: finalPrice,
      inStock,
      deliveryTime: "5-15 min",
      status: "active",
      pricingMode,
      sellerProductInfoId,
      roundingTarget,
      description,
      buyerInputs,
    });

    return NextResponse.json({
      product: {
        id: product._id.toString(),
        customTitle: product.customTitle,
        gameId: product.gameId.toString(),
        productCategoryId: product.productCategoryId.toString(),
        price: product.price,
        inStock: product.inStock,
        status: product.status,
        pricingMode: product.pricingMode,
      },
    });
  } catch (err) {
    console.error("Seller product create error:", err);
    return apiError("Failed to create product. Please try again.", 500);
  }
}
