import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/Game";
import { apiError } from "@/lib/api-utils";

/** Default games to seed when DB has none (Kaleoz-style). */
const DEFAULT_GAMES = [
  { title: "MLBB", image: "", description: "Mobile Legends: Bang Bang" },
  { title: "PUBG", image: "", description: "PUBG Mobile" },
  { title: "Free Fire", image: "", description: "Garena Free Fire" },
  { title: "Genshin Impact", image: "", description: "Genshin Impact" },
  { title: "CODM", image: "", description: "Call of Duty Mobile" },
];

/**
 * GET /api/games – list all games. Seeds default games if none exist.
 */
export async function GET() {
  try {
    await connectDB();
    let games = await Game.find().sort({ title: 1 }).lean();
    if (games.length === 0) {
      await Game.insertMany(DEFAULT_GAMES);
      games = await Game.find().sort({ title: 1 }).lean();
    }
    return NextResponse.json({
      games: games.map((g) => ({
        id: g._id.toString(),
        title: g.title,
        image: g.image ?? "",
        description: g.description ?? "",
      })),
    });
  } catch (err) {
    console.error("Games list error:", err);
    return apiError("Failed to load games.", 500);
  }
}
