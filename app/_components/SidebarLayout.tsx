"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: string };

export default function SidebarLayout({
  navItems,
  panelLabel,
  panelTitle,
  panelSubtitle,
  backHref = "/",
  children,
}: {
  navItems: NavItem[];
  panelLabel: string;
  panelTitle: string;
  panelSubtitle: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 border-r border-slate-800 bg-slate-900 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <Link href={navItems[0]?.href ?? "/"} className="block">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
              KTLM Digital
            </span>
            <span className="ml-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              {panelLabel}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto" aria-label={`${panelLabel} sections`}>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active =
                item.href === navItems[0]?.href
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                  >
                    <span className="text-base" aria-hidden>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-slate-800 p-3">
          <Link
            href={backHref}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3 md:px-6 md:py-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100 md:text-xl">{panelTitle}</h1>
            <p className="text-xs text-slate-500 md:text-sm">{panelSubtitle}</p>
          </div>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
