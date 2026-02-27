"use client";

import { useCallback, useEffect, useState } from "react";

type SellerReview = {
  id: string;
  buyerName: string;
  productTitle: string;
  rating: number;
  text: string;
  reply: string | null;
  createdAt: string;
};

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/reviews");
      const data = await res.json();
      if (res.ok) setReviews(data.reviews ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim();
    if (!text) return;
    setSubmitting(reviewId);
    try {
      const res = await fetch("/api/seller/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reply: text }),
      });
      if (res.ok) {
        setReplyText((p) => ({ ...p, [reviewId]: "" }));
        fetchReviews();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reply.");
      }
    } catch { alert("Network error."); } finally { setSubmitting(null); }
  };

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Reviews</h2>
        <p className="text-sm text-slate-500">Buyer reviews and your replies</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-slate-500">
          No reviews received yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{r.productTitle}</p>
                  <p className="text-xs text-slate-500">by {r.buyerName}</p>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 text-sm">{stars(r.rating)}</span>
                  <p className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <p className="text-sm text-slate-200 border-l-2 border-slate-600 pl-3">&ldquo;{r.text}&rdquo;</p>

              {r.reply ? (
                <div className="ml-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs text-emerald-400 mb-0.5">Your Reply:</p>
                  <p className="text-sm text-slate-200">{r.reply}</p>
                </div>
              ) : (
                <div className="ml-4 flex gap-2">
                  <input
                    type="text"
                    value={replyText[r.id] ?? ""}
                    onChange={(e) => setReplyText((p) => ({ ...p, [r.id]: e.target.value }))}
                    placeholder="Write a reply..."
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleReply(r.id)}
                    disabled={submitting === r.id || !replyText[r.id]?.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {submitting === r.id ? "..." : "Reply"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
