import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Wallet } from "@/lib/models/Wallet";

/**
 * GET /api/auth/session – return current user and wallets if logged in, else { user: null }.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectDB();
    const user = await User.findById(session.userId)
      .select("-passwordHash")
      .lean();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const wallets = await Wallet.find({ userId: user._id })
      .select("currency balance escrowBalance")
      .lean();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        kycStatus: user.kycStatus,
        telegramUsername: user.telegramUsername,
        createdAt: user.createdAt,
      },
      wallets: wallets.map((w) => ({
        currency: w.currency,
        balance: w.balance,
        escrowBalance: w.escrowBalance,
      })),
    });
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
