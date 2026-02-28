import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { KYC } from "@/lib/models/KYC";
import { ProfileSignOut } from "./ProfileSignOut";
import { KycApplyButton } from "./KycApplyButton";
import { OrderHistory } from "./OrderHistory";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId)
    .select("-passwordHash")
    .lean();
  if (!user) redirect("/login");

  let kycStatus = user.kycStatus ?? "none";

  // Auto-fix: old users have kycStatus "pending" from the previous default
  // but never actually submitted a KYC application. Reset them to "none".
  if (kycStatus === "pending" && user.role === "buyer") {
    const hasKycDoc = await KYC.exists({ userId: user._id });
    if (!hasKycDoc) {
      await User.findByIdAndUpdate(user._id, { $set: { kycStatus: "none" } });
      kycStatus = "none";
    }
  }

  const canApplyKyc =
    user.role === "buyer" && (kycStatus === "none" || kycStatus === "rejected");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 safe-area-pb">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Kone The Lay Myar
            </span>
            <span className="text-slate-400 font-normal text-sm ml-1">
              Digital
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5">
              <span className="text-xs font-semibold text-emerald-400">
                {(user.balance ?? 0).toLocaleString()} MMK
              </span>
              <Link
                href="/deposit"
                title="Deposit / Add Funds"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold transition hover:bg-emerald-500/40 hover:text-emerald-300"
              >
                +
              </Link>
            </div>
            <ProfileSignOut />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold text-slate-100 mb-6">Profile</h1>

        {/* Account Info */}
        <section className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Account
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-200">
                {user.email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-200">
                {user.fullName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd>
                <span className="inline-flex rounded-md bg-slate-600/50 px-2 py-0.5 font-medium text-slate-300">
                  {user.role === "admin"
                    ? "Admin"
                    : user.role === "seller"
                      ? "Seller"
                      : "Buyer"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">KYC Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                    kycStatus === "approved"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : kycStatus === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : kycStatus === "pending"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-600/50 text-slate-400"
                  }`}
                >
                  {kycStatus === "none" ? "Not Submitted" : kycStatus}
                </span>
              </dd>
            </div>
            {user.telegramUsername && (
              <div>
                <dt className="text-slate-500">Telegram</dt>
                <dd className="font-medium text-slate-200">
                  @{user.telegramUsername}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Balance */}
        <section className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Balance
          </h2>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
            <p className="text-xs text-slate-500 mb-1">Wallet Balance</p>
            <p className="text-3xl font-bold text-emerald-400">
              {(user.balance ?? 0).toLocaleString()}
              <span className="ml-2 text-base font-normal text-slate-400">
                MMK
              </span>
            </p>
            <Link
              href="/deposit"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 active:scale-[0.98]"
            >
              <span className="text-lg leading-none">💳</span>
              Deposit / Add Funds
            </Link>
          </div>
        </section>

        {/* Order History */}
        <section className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Recent Orders
          </h2>
          <OrderHistory />
        </section>

        {/* Settings Placeholders */}
        <section className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Settings
          </h2>
          <div className="space-y-2">
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-900/50 px-4 py-3 text-sm text-slate-300 opacity-60 cursor-not-allowed"
            >
              <span>Change Password</span>
              <span className="text-xs text-slate-500">Coming Soon</span>
            </button>
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-900/50 px-4 py-3 text-sm text-slate-300 opacity-60 cursor-not-allowed"
            >
              <span>Change Email</span>
              <span className="text-xs text-slate-500">Coming Soon</span>
            </button>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-xl border border-purple-500/50 bg-purple-500/10 py-3 px-4 text-center font-medium text-purple-400 transition hover:bg-purple-500/20"
            >
              Go to Admin Panel
            </Link>
          )}
          {user.role === "seller" && (
            <Link
              href="/seller"
              className="rounded-xl border border-slate-700/60 bg-slate-800/60 py-3 px-4 text-center font-medium text-slate-200 transition hover:bg-slate-800 hover:border-emerald-500/40"
            >
              Go to Seller Dashboard
            </Link>
          )}

          {canApplyKyc && <KycApplyButton />}

          {user.role === "buyer" && kycStatus === "pending" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 py-3 px-4 text-center text-sm text-amber-400">
              Your seller application is under review. Please wait for admin
              approval.
            </div>
          )}

          <Link
            href="/orders"
            className="rounded-xl border border-slate-700/60 bg-slate-800/60 py-3 px-4 text-center font-medium text-slate-200 transition hover:bg-slate-800 hover:border-emerald-500/40"
          >
            My Orders
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-700/60 bg-slate-800/60 py-3 px-4 text-center font-medium text-slate-200 transition hover:bg-slate-800 hover:border-emerald-500/40"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
