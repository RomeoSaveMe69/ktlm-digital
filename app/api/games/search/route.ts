import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/Game";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/games/search?q=<query>
 * Case-insensitive partial match on game titles using $regex.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();

    if (!q || q.length < 1) {
      return NextResponse.json({ games: [] });
    }

    await connectDB();

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const games = await Game.find(
      { title: { $regex: escaped, $options: "i" } },
    )
      .sort({ title: 1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      games: games.map((g) => ({
        id: g._id.toString(),
        title: g.title,
        image: g.image ?? "",
      })),
    });
  } catch (err) {
    console.error("Game search error:", err);
    return apiError("Search failed.", 500);
  }
}
