import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

/** PATCH: Request role change (e.g. buyer -> seller). Only buyer can become seller. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;
    if (role !== "seller") {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (user.role !== "buyer") {
      return NextResponse.json(
        { error: "Only buyers can request to become a seller." },
        { status: 400 },
      );
    }

    user.role = "seller";
    await user.save();

    return NextResponse.json({ role: user.role });
  } catch (err) {
    console.error("Role update error:", err);
    return NextResponse.json(
      { error: "Failed to update role." },
      { status: 500 },
    );
  }
}
