import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { BecomeSellerForm } from "./BecomeSellerForm";

export default async function SellerApplyPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId)
    .select("role kycStatus")
    .lean();
  if (!user) redirect("/login");
  if (user.role === "seller" || user.role === "admin") redirect("/seller");

  const kycStatus = user.kycStatus ?? "none";

  if (kycStatus === "pending") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
        <header className="mb-8">
          <Link
            href="/profile"
            className="text-sm text-slate-500 hover:text-emerald-400"
          >
            ← Back to Profile
          </Link>
          <h1 className="mt-4 text-xl font-bold text-slate-100">
            Application Pending
          </h1>
        </header>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-amber-400">
            Your KYC application is currently under review.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Please wait for admin approval. We will update your account status
            once the review is complete.
          </p>
        </div>
      </div>
    );
  }

  if (kycStatus === "approved") {
    redirect("/seller");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <header className="mb-8">
        <Link
          href="/profile"
          className="text-sm text-slate-500 hover:text-emerald-400"
        >
          ← Back to Profile
        </Link>
        <h1 className="mt-4 text-xl font-bold text-slate-100">
          Become a Seller
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Complete KYC verification to start selling on our platform.
        </p>
        {kycStatus === "rejected" && (
          <p className="mt-2 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400">
            Your previous application was rejected. You may reapply with
            correct information.
          </p>
        )}
      </header>
      <BecomeSellerForm />
    </div>
  );
}
