import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Wallet } from "@/lib/models/Wallet";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
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
    const message = err instanceof Error ? err.message : String(err);
    console.error("Signup error:", err);
    let userMessage: string;
    if (message.includes("MONGODB_URI") || message.includes("JWT_SECRET")) {
      userMessage = "Server configuration error. Please add MONGODB_URI and JWT_SECRET in .env.local or Vercel Environment Variables.";
    } else if (message.includes("connect") || message.includes("MongoNetworkError") || message.includes("MongoServerError")) {
      userMessage = "Database connection failed. Check MONGODB_URI and MongoDB Atlas network access (allow 0.0.0.0/0).";
    } else if (message.includes("E11000") || message.includes("duplicate key")) {
      userMessage = "An account with this email already exists.";
    } else {
      userMessage = message.length > 200 ? "Sign up failed. Please try again." : message;
    }
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
