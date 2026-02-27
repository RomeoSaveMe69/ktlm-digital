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

    // Enforce account status on every session check
    const status = (user as Record<string, unknown>).status as string | undefined ?? "ACTIVE";
    const suspendedUntil = (user as Record<string, unknown>).suspendedUntil as Date | null | undefined;

    if (status === "BANNED") {
      return NextResponse.json(
        { user: null, error: "Your account has been permanently banned." },
        { status: 200 },
      );
    }

    if (status === "SUSPENDED") {
      const until = suspendedUntil ? new Date(suspendedUntil) : null;
      if (until && until > new Date()) {
        return NextResponse.json(
          { user: null, error: `Account suspended until ${until.toLocaleString()}.` },
          { status: 200 },
        );
      }
      // Suspension expired — auto-reactivate
      await User.findByIdAndUpdate(user._id, {
        $set: { status: "ACTIVE", suspendedUntil: null },
      });
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
