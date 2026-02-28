"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const BUYER_NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/chat", label: "Chat", icon: "💬" },
];

const SELLER_NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/seller", label: "Seller", icon: "🏪" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/chat", label: "Chat", icon: "💬" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setRole(d.user.role);
      })
      .catch(() => {});
  }, []);

  const isHiddenRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/seller") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  if (isHiddenRoute || !role || role === "admin") return null;

  const navItems = role === "seller" ? SELLER_NAV : BUYER_NAV;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md safe-area-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                active
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
