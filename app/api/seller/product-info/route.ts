import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SellerProductInfo } from "@/lib/models/SellerProductInfo";
import { SellerCurrency } from "@/lib/models/SellerCurrency";
import { Game } from "@/lib/models/Game";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/seller/product-info?gameId=... – list seller's product infos, optionally filtered by game. */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const sellerIdStr = String(session.userId ?? "").trim();
    if (!sellerIdStr || !mongoose.Types.ObjectId.isValid(sellerIdStr)) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId") ?? "";

    await connectDB();

    const query: Record<string, unknown> = {
      sellerId: new mongoose.Types.ObjectId(sellerIdStr),
    };
    if (gameId && mongoose.Types.ObjectId.isValid(gameId)) {
      query.gameId = new mongoose.Types.ObjectId(gameId);
    }

    const infos = await SellerProductInfo.find(query)
      .populate("gameId", "title")
      .populate("productCategoryId", "title")
      .populate("currencyId", "name rate profitMargin")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      productInfos: infos.map((i) => ({
        id: i._id.toString(),
        gameId:
          (i.gameId as { _id?: { toString(): string } })?._id?.toString?.() ??
          i.gameId?.toString() ??
          "",
        gameTitle: (i.gameId as { title?: string })?.title ?? "",
        productCategoryId:
          (
            i.productCategoryId as { _id?: { toString(): string } }
          )?._id?.toString?.() ??
          i.productCategoryId?.toString() ??
          "",
        categoryTitle:
          (i.productCategoryId as { title?: string })?.title ?? "",
        costAmount: i.costAmount,
        currencyId:
          (i.currencyId as { _id?: { toString(): string } })?._id?.toString?.() ??
          i.currencyId?.toString() ??
          "",
        currencyName: (i.currencyId as { name?: string })?.name ?? "",
        currencyRate: (i.currencyId as { rate?: number })?.rate ?? 0,
        currencyProfitMargin:
          (i.currencyId as { profitMargin?: number })?.profitMargin ?? 0,
      })),
    });
  } catch (err) {
    console.error("Seller product-info GET error:", err);
    return apiError("Failed to load product infos.", 500);
  }
}

/** POST /api/seller/product-info – create a product info entry. */
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
    const gameId = String(body.gameId ?? "").trim();
    const productCategoryId = String(body.productCategoryId ?? "").trim();
    const costAmount = Number(body.costAmount);
    const currencyId = String(body.currencyId ?? "").trim();

    if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json(
        { error: "Valid game is required." },
        { status: 400 },
      );
    }
    if (
      !productCategoryId ||
      !mongoose.Types.ObjectId.isValid(productCategoryId)
    ) {
      return NextResponse.json(
        { error: "Valid product category is required." },
        { status: 400 },
      );
    }
    if (isNaN(costAmount) || costAmount <= 0) {
      return NextResponse.json(
        { error: "Cost amount must be greater than 0." },
        { status: 400 },
      );
    }
    if (!currencyId || !mongoose.Types.ObjectId.isValid(currencyId)) {
      return NextResponse.json(
        { error: "Valid currency is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const [game, category, currency] = await Promise.all([
      Game.findById(gameId).lean(),
      ProductCategory.findById(productCategoryId).lean(),
      SellerCurrency.findOne({
        _id: new mongoose.Types.ObjectId(currencyId),
        sellerId: new mongoose.Types.ObjectId(sellerIdStr),
      }).lean(),
    ]);

    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }
    if (!category || category.gameId.toString() !== gameId) {
      return NextResponse.json(
        { error: "Category not found or does not belong to game." },
        { status: 400 },
      );
    }
    if (!currency) {
      return NextResponse.json(
        { error: "Currency not found." },
        { status: 404 },
      );
    }

    const info = await SellerProductInfo.create({
      sellerId: new mongoose.Types.ObjectId(sellerIdStr),
      gameId: new mongoose.Types.ObjectId(gameId),
      productCategoryId: new mongoose.Types.ObjectId(productCategoryId),
      costAmount,
      currencyId: new mongoose.Types.ObjectId(currencyId),
    });

    return NextResponse.json({
      productInfo: {
        id: info._id.toString(),
        gameId: info.gameId.toString(),
        gameTitle: (game as { title?: string }).title ?? "",
        productCategoryId: info.productCategoryId.toString(),
        categoryTitle: (category as { title?: string }).title ?? "",
        costAmount: info.costAmount,
        currencyId: info.currencyId.toString(),
        currencyName: currency.name,
      },
    });
  } catch (err) {
    console.error("Seller product-info create error:", err);
    return apiError("Failed to create product info.", 500);
  }
}
