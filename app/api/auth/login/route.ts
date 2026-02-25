import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
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
    const message = err instanceof Error ? err.message : String(err);
    console.error("Login error:", err);
    let userMessage: string;
    if (message.includes("MONGODB_URI") || message.includes("JWT_SECRET")) {
      userMessage = "Server configuration error. Add MONGODB_URI and JWT_SECRET in .env.local or Vercel Environment Variables.";
    } else if (message.includes("Authentication failed") || message.includes("bad auth") || message.includes("auth failed")) {
      userMessage = "Database authentication failed. Check MONGODB_URI username and password in .env.local or Vercel.";
    } else if (message.includes("connect") || message.includes("MongoNetworkError") || message.includes("MongoServerError")) {
      userMessage = "Database connection failed. Check MONGODB_URI and MongoDB Atlas network access (allow 0.0.0.0/0).";
    } else {
      userMessage = message.length > 200 ? "Login failed. Please try again." : message;
    }
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
