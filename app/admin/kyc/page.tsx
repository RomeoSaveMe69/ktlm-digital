"use client";

import { useCallback, useEffect, useState } from "react";

type KycApp = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userBid: string;
  userRole: string;
  userKycStatus: string;
  realName: string;
  nrcNumber: string;
  nrcFrontImage: string;
  nrcBackImage: string;
  reason: string;
  status: string;
  createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
};

function ImageModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 shadow-lg hover:text-slate-100"
        >
          ✕
        </button>
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] w-auto rounded-xl border border-slate-700 object-contain"
        />
      </div>
    </div>
  );
}

export default function AdminKycPage() {
  const [apps, setApps] = useState<KycApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchApps = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/kyc");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load.");
      setApps(data.applications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  async function handleAction(id: string, action: "approve" | "reject") {
    const actionLabel = action === "approve" ? "approve" : "reject";
    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} this KYC application?`,
      )
    )
      return;

    setActingId(id);
    try {
      const res = await fetch(`/api/admin/kyc/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Action failed.");
        return;
      }
      await fetchApps();
    } catch {
      alert("Network error.");
    } finally {
      setActingId(null);
    }
  }

  const filteredApps =
    filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">KYC Applications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review and manage seller verification requests.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "all", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === tab
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "pending" && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                {apps.filter((a) => a.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center text-red-400">
          {error}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-16 text-center">
          <p className="text-slate-500">
            No {filter === "all" ? "" : filter} KYC applications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {app.realName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {app.userEmail} · {app.userBid}
                  </p>
                  <p className="text-xs text-slate-500">
                    Applied:{" "}
                    {new Date(app.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[app.status] ?? "bg-slate-600/50 text-slate-400"}`}
                >
                  {app.status}
                </span>
              </div>

              {/* Details */}
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">Real Name</dt>
                  <dd className="font-medium text-slate-200">
                    {app.realName}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">NRC Number</dt>
                  <dd className="font-mono font-medium text-slate-200">
                    {app.nrcNumber}
                  </dd>
                </div>
              </dl>

              {/* Reason / Description */}
              {app.reason && (
                <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Reason / What they plan to sell
                  </p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {app.reason}
                  </p>
                </div>
              )}

              {/* NRC Images */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">NRC Front</p>
                  <button
                    type="button"
                    onClick={() =>
                      setViewImage({
                        src: app.nrcFrontImage,
                        alt: "NRC Front",
                      })
                    }
                    className="block w-full"
                  >
                    <img
                      src={app.nrcFrontImage}
                      alt="NRC Front"
                      className="h-32 w-full rounded-lg border border-slate-700 object-cover transition hover:border-emerald-500/50 hover:opacity-80 cursor-zoom-in"
                    />
                  </button>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">NRC Back</p>
                  <button
                    type="button"
                    onClick={() =>
                      setViewImage({
                        src: app.nrcBackImage,
                        alt: "NRC Back",
                      })
                    }
                    className="block w-full"
                  >
                    <img
                      src={app.nrcBackImage}
                      alt="NRC Back"
                      className="h-32 w-full rounded-lg border border-slate-700 object-cover transition hover:border-emerald-500/50 hover:opacity-80 cursor-zoom-in"
                    />
                  </button>
                </div>
              </div>

              {/* Actions */}
              {app.status === "pending" && (
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAction(app.id, "approve")}
                    disabled={actingId === app.id}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {actingId === app.id ? "..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(app.id, "reject")}
                    disabled={actingId === app.id}
                    className="flex-1 rounded-xl border border-red-500/50 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {actingId === app.id ? "..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image modal */}
      {viewImage && (
        <ImageModal
          src={viewImage.src}
          alt={viewImage.alt}
          onClose={() => setViewImage(null)}
        />
      )}
    </div>
  );
}
