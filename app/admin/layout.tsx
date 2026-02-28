import SidebarLayout from "@/app/_components/SidebarLayout";
import { AdminDataProvider } from "./_context/AdminDataContext";

const SIDEBAR_NAV = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/order", label: "Order", icon: "📦" },
  { href: "/admin/seller", label: "Seller", icon: "🏪" },
  { href: "/admin/user", label: "User", icon: "👥" },
  { href: "/admin/recharge", label: "Recharge", icon: "💰" },
  { href: "/admin/payment-info", label: "Payment Info", icon: "🏦" },
  { href: "/admin/games", label: "Games", icon: "🎮" },
  { href: "/admin/product", label: "Product", icon: "🛒" },
  { href: "/admin/withdraw", label: "Withdraw", icon: "💸" },
  { href: "/admin/kyc", label: "KYC", icon: "🪪" },
  { href: "/admin/chat", label: "Chat", icon: "💬" },
  { href: "/admin/storage", label: "Storage", icon: "🗄️" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout
      navItems={SIDEBAR_NAV}
      panelLabel="Admin"
      panelTitle="Admin Dashboard"
      panelSubtitle="Kone The Lay Myar Digital — Management"
    >
      <AdminDataProvider>{children}</AdminDataProvider>
    </SidebarLayout>
  );
}
