import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Wallet } from "@/lib/models/Wallet";
import { createSession, setSessionCookie } from "@/lib/auth";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

/**
 * POST /api/auth/signup – register with email/password; creates user (role: buyer) and MMK/USDT wallets.
 * Body: { email, password, fullName? }. Returns { user } or { error }.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;
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
    const trimmedEmail = email.trim().toLowerCase();
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: trimmedEmail,
      passwordHash,
      fullName: fullName?.trim() || undefined,
      role: "buyer",
      kycStatus: "pending",
    });

    // Create MMK and USDT wallets for new user
    await Wallet.insertMany([
      { userId: user._id, currency: "MMK" },
      { userId: user._id, currency: "USDT" },
    ]);

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
    console.error("Signup error:", err);
    const userMessage = normalizeErrorMessage(err);
    return apiError(
      userMessage.includes("Database") || userMessage.includes("already exists")
        ? userMessage
        : "Sign up failed. Please try again.",
      500,
    );
  }
}
