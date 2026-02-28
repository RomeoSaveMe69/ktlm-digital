import SidebarLayout from "@/app/_components/SidebarLayout";

const SIDEBAR_NAV = [
  { href: "/seller", label: "Overview", icon: "📊" },
  { href: "/seller/order", label: "Order", icon: "📦" },
  { href: "/seller/wallet", label: "Wallet", icon: "💳" },
  { href: "/seller/chat", label: "Chat", icon: "💬" },
  { href: "/seller/reviews", label: "Reviews", icon: "⭐" },
  { href: "/seller/product", label: "Product", icon: "🛒" },
  { href: "/seller/product-info", label: "Product Info", icon: "📄" },
  { href: "/seller/price", label: "Price", icon: "💰" },
  { href: "/seller/profile", label: "Shop Profile", icon: "🏪" },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout
      navItems={SIDEBAR_NAV}
      panelLabel="Seller"
      panelTitle="Seller Dashboard"
      panelSubtitle="Kone The Lay Myar Digital — Seller Panel"
    >
      {children}
    </SidebarLayout>
  );
}
