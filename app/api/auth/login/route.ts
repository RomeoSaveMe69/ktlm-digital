import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { createSession, setSessionCookie } from "@/lib/auth";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

/**
 * POST /api/auth/login – authenticate with email/password and set session cookie.
 * Body: { email, password }. Returns { user: { id, email, fullName, role } } or { error }.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = await createSession({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    const userMessage = normalizeErrorMessage(err);
    return apiError(
      userMessage.includes("Database")
        ? userMessage
        : "Login failed. Please try again.",
      500,
    );
  }
}
