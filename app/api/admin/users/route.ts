import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

/** GET: List all users (admin only). No password. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        kycStatus: u.kycStatus,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error("Admin users list error:", err);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}
