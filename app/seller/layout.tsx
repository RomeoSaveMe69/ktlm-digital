import Link from "next/link";
import { requireSeller } from "@/lib/auth";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSeller();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/95 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/seller" className="font-bold">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              KTLM
            </span>
            <span className="ml-1 text-slate-500 text-sm">Seller</span>
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/seller"
              className="text-slate-400 hover:text-slate-200"
            >
              My Products
            </Link>
            <Link
              href="/profile"
              className="text-slate-400 hover:text-slate-200"
            >
              Profile
            </Link>
            <Link href="/" className="text-slate-400 hover:text-slate-200">
              Home
            </Link>
          </nav>
        </div>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
