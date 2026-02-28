import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/Game";
import { uploadImage } from "@/lib/cloudinary";
import { apiError } from "@/lib/api-utils";

/** GET /api/admin/games – list all games (admin). */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const games = await Game.find().sort({ title: 1 }).lean();
    return NextResponse.json({
      games: games.map((g) => ({
        id: g._id.toString(),
        name: g.title,
        title: g.title,
        description: g.description ?? "",
        image: g.image ?? null,
      })),
    });
  } catch (err) {
    console.error("Admin games list error:", err);
    return apiError("Failed to load games.", 500);
  }
}

/** POST /api/admin/games – create game (admin). Body: { title, description?, image? } */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const description = typeof body.description === "string" ? body.description.trim() : "";
    let image: string | undefined;
    if (typeof body.image === "string" && body.image) {
      image = body.image.startsWith("data:")
        ? await uploadImage(body.image, "games")
        : body.image;
    }
    const doc = await Game.create({ title, description: description || undefined, image });
    return NextResponse.json({
      game: {
        id: doc._id.toString(),
        name: doc.title,
        title: doc.title,
        description: doc.description ?? "",
        image: doc.image ?? null,
      },
    });
  } catch (err) {
    console.error("Admin games create error:", err);
    return apiError("Failed to create game.", 500);
  }
}
