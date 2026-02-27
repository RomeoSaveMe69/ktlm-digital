"use client";

/**
 * Product Detail & Checkout page.
 * - Shows product info, description, seller name
 * - Dynamic buyerInputs form (required/optional)
 * - "Add to Cart" button
 * - "Buy Now" → checks balance → deducts → creates Order
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type BuyerInput = { label: string; isRequired: boolean };
type Product = {
  id: string;
  customTitle: string;
  gameId: string;
  gameTitle: string;
  categoryTitle: string;
  sellerId: string;
  sellerName: string;
  price: number;
  inStock: number;
  deliveryTime: string;
  totalSold: number;
  description: string;
  buyerInputs: BuyerInput[];
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [buying, setBuying] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setNotFound(true); return; }
      setProduct(data.product);
      const initValues: Record<string, string> = {};
      (data.product.buyerInputs ?? []).forEach((bi: BuyerInput) => {
        initValues[bi.label] = "";
      });
      setInputValues(initValues);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  const handleBuyNow = async () => {
    if (!product) return;
    setError(null);
    setOrderSuccess(null);

    // Validate inputs
    const missing = (product.buyerInputs ?? [])
      .filter((bi) => bi.isRequired && !inputValues[bi.label]?.trim())
      .map((bi) => bi.label);
    if (missing.length > 0) {
      setError(`ဖြည့်ရန် လိုအပ်သောအကွက်: ${missing.join(", ")}`);
      return;
    }

    const buyerInputData = Object.entries(inputValues)
      .map(([label, value]) => ({ label, value: value.trim() }))
      .filter((d) => d.value);

    setBuying(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, buyerInputData }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Order failed.");
        return;
      }
      setOrderSuccess(`Order ${data.order?.orderId} အောင်မြင်ပါပြီ! Orders page တွင် စစ်ဆေးပါ။`);
      setInputValues({});
    } catch {
      setError("Network error.");
    } finally {
      setBuying(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingCart(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.ok) setCartSuccess(true);
    } catch {
      /* ignore */
    } finally {
      setAddingCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }
  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <p>Product မတွေ့ပါ။</p>
        <Link href="/" className="text-emerald-400 hover:underline">← Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            ← Back
          </button>
          <h1 className="flex-1 truncate text-sm font-semibold text-slate-200">
            {product.customTitle}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-6 space-y-5">
        {/* Product Info Card */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-100">{product.customTitle}</h2>
              <p className="text-sm text-slate-400">
                {product.gameTitle} · {product.categoryTitle}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-emerald-400">
                {product.price.toLocaleString()}
                <span className="text-sm text-slate-400 ml-1">MMK</span>
              </p>
              <p className="text-xs text-slate-500">⚡ {product.deliveryTime}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-md px-2 py-1 font-medium ${
              product.inStock > 0
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}>
              {product.inStock > 0 ? `Stock: ${product.inStock}` : "Out of Stock"}
            </span>
            {product.totalSold > 0 && (
              <span className="rounded-md bg-amber-500/20 px-2 py-1 text-amber-400">
                🔥 {product.totalSold} sold
              </span>
            )}
            <span className="rounded-md bg-slate-700/50 px-2 py-1 text-slate-400">
              Seller: {product.sellerName}
            </span>
          </div>

          {product.description && (
            <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Description
              </p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Chat with Seller */}
          {product.sellerId && (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-chat", {
                    detail: {
                      sellerId: product.sellerId,
                      sellerName: product.sellerName,
                    },
                  }),
                );
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-400 transition hover:bg-violet-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat with Seller
            </button>
          )}
        </div>

        {/* Buyer Inputs Form */}
        {product.buyerInputs.length > 0 && (
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Order Information
            </h3>
            {product.buyerInputs.map((bi) => (
              <div key={bi.label}>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {bi.label}
                  {bi.isRequired ? (
                    <span className="ml-1 text-red-400">*</span>
                  ) : (
                    <span className="ml-1 text-xs text-slate-500">(Optional)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={inputValues[bi.label] ?? ""}
                  onChange={(e) =>
                    setInputValues((v) => ({ ...v, [bi.label]: e.target.value }))
                  }
                  placeholder={`Enter ${bi.label}`}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Feedback messages */}
        {error && (
          <p className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-400">{error}</p>
        )}
        {orderSuccess && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {orderSuccess}
            <Link href="/orders" className="ml-2 underline">
              Orders ကြည့်ရန်
            </Link>
          </div>
        )}
        {cartSuccess && (
          <p className="rounded-lg bg-violet-500/10 px-4 py-2 text-sm text-violet-400">
            Cart တွင် ထည့်ပြီးပါပြီ!
            <Link href="/cart" className="ml-2 underline">
              Cart ကြည့်ရန်
            </Link>
          </p>
        )}
      </main>

      {/* Sticky bottom action buttons */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingCart || product.inStock <= 0}
            className="flex-1 rounded-xl border border-slate-600 bg-slate-800 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
          >
            {addingCart ? "..." : "🛒 Add to Cart"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={buying || product.inStock <= 0}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {buying ? "Processing..." : "⚡ Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
