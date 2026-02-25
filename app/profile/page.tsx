import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Wallet } from "@/lib/models/Wallet";
import { ProfileSignOut } from "./ProfileSignOut";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findById(session.userId)
    .select("-passwordHash")
    .lean();
  if (!user) {
    redirect("/login");
  }

  const wallets = await Wallet.find({ userId: user._id })
    .select("currency balance escrowBalance")
    .lean();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 safe-area-pb">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Kone The Lay Myar
            </span>
            <span className="text-slate-400 font-normal text-sm ml-1">Digital</span>
          </Link>
          <ProfileSignOut />
        </div>
      </header>

      <main className="px-4 py-6">
        <h1 className="text-xl font-bold text-slate-100 mb-6">Profile</h1>

        <section className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Account
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-200">{user.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-200">{user.fullName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd>
                <span className="inline-flex rounded-md bg-slate-600/50 px-2 py-0.5 font-medium text-slate-300 capitalize">
                  {user.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">KYC</dt>
              <dd>
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                    user.kycStatus === "approved"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : user.kycStatus === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {user.kycStatus}
                </span>
              </dd>
            </div>
            {user.telegramUsername && (
              <div>
                <dt className="text-slate-500">Telegram</dt>
                <dd className="font-medium text-slate-200">@{user.telegramUsername}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="mb-6 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Balance
          </h2>
          {wallets && wallets.length > 0 ? (
            <ul className="space-y-3">
              {wallets.map((w) => (
                <li
                  key={w.currency}
                  className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-900/50 px-4 py-3"
                >
                  <span className="font-medium text-slate-300">{w.currency}</span>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-400">
                      {Number(w.balance).toLocaleString()} {w.currency}
                    </p>
                    {Number(w.escrowBalance) > 0 && (
                      <p className="text-xs text-slate-500">
                        Escrow: {Number(w.escrowBalance).toLocaleString()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No wallets yet.</p>
          )}
        </section>

        <div className="flex flex-col gap-3">
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
