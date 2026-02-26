import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { GamePackage } from "@/lib/models/Package";
import { apiError } from "@/lib/api-utils";

/** GET /api/admin/packages?gameId= – list all or by gameId (admin). */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const query = gameId && mongoose.Types.ObjectId.isValid(gameId)
      ? { gameId: new mongoose.Types.ObjectId(gameId) }
      : {};
    const packages = await GamePackage.find(query)
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({
      packages: packages.map((p) => ({
        id: p._id.toString(),
        gameId: p.gameId.toString(),
        name: p.name,
      })),
    });
  } catch (err) {
    console.error("Admin packages list error:", err);
    return apiError("Failed to load packages.", 500);
  }
}

/** POST /api/admin/packages – create. Body: { gameId, name } */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await request.json();
    const gameId = body.gameId;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
      return NextResponse.json({ error: "Valid gameId is required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const doc = await GamePackage.create({
      gameId: new mongoose.Types.ObjectId(gameId),
      name,
    });
    return NextResponse.json({
      package: {
        id: doc._id.toString(),
        gameId: doc.gameId.toString(),
        name: doc.name,
      },
    });
  } catch (err) {
    console.error("Admin packages create error:", err);
    return apiError("Failed to create package.", 500);
  }
}
