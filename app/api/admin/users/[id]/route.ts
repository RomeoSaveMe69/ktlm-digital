import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

const ROLES = ["buyer", "seller", "admin"] as const;

/** PATCH: Update user (admin only). e.g. role change. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.role && ROLES.includes(body.role)) {
      updates.role = body.role;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates (e.g. role)." }, { status: 400 });
    }
    await connectDB();
    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .select("-passwordHash")
      .lean();
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    });
  } catch (err) {
    console.error("Admin user update error:", err);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
