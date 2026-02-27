import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/Game";
import { ProductCategory } from "@/lib/models/ProductCategory";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/games/[id] – return game info + its categories. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectDB();

    const game = await Game.findById(id).lean();
    if (!game) return apiError("Game not found.", 404);

    const categories = await ProductCategory.find({ gameId: id })
      .sort({ title: 1 })
      .lean();

    return NextResponse.json({
      game: {
        id: game._id.toString(),
        title: game.title,
        image: game.image ?? "",
        description: game.description ?? "",
      },
      categories: categories.map((c) => ({
        id: c._id.toString(),
        title: c.title,
      })),
    });
  } catch (err) {
    console.error("Game detail error:", err);
    return apiError("Failed to load game.", 500);
  }
}
