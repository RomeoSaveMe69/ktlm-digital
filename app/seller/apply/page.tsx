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
  const user = await User.findById(session.userId).select("role").lean();
  if (!user) redirect("/login");
  if (user.role === "seller" || user.role === "admin") redirect("/seller");

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
          Sell game top-ups and digital goods. KYC may be required later.
        </p>
      </header>
      <BecomeSellerForm />
    </div>
  );
}
