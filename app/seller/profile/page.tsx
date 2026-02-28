"use client";

import { useCallback, useEffect, useState } from "react";

const MAX_IMAGE_BYTES = 500 * 1024;

type ProfileData = {
  profileImage: string;
  shopName: string;
  shopDescription: string;
  fullName: string;
  email: string;
};

export default function SellerProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/profile/update");
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setShopName(data.profile.shopName || "");
        setShopDescription(data.profile.shopDescription || "");
        setImagePreview(data.profile.profileImage || null);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("File size must be ≤ 500 KB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("Only image files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const body: Record<string, string> = {};
      if (shopName !== (profile?.shopName ?? "")) body.shopName = shopName;
      if (shopDescription !== (profile?.shopDescription ?? ""))
        body.shopDescription = shopDescription;
      if (imagePreview && imagePreview !== (profile?.profileImage ?? ""))
        body.profileImage = imagePreview;

      if (Object.keys(body).length === 0) {
        setMessage({ type: "error", text: "No changes to save." });
        return;
      }

      const res = await fetch("/api/seller/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed.");

      setProfile((prev) =>
        prev ? { ...prev, ...data.profile } : prev,
      );
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Shop Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Customize how your shop appears to buyers.
        </p>
      </div>

      {message && (
        <p
          className={`rounded-lg px-4 py-2.5 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 space-y-5"
      >
        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Profile Image
          </label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 rounded-full border-2 border-slate-600 bg-slate-700 overflow-hidden flex items-center justify-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl text-slate-500">👤</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-300 hover:file:bg-slate-600"
              />
              <p className="mt-1 text-xs text-slate-500">
                Max 500 KB. JPG, PNG, or WebP.
              </p>
              {imageError && (
                <p className="mt-1 text-xs text-amber-400">{imageError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Shop Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Shop Name
          </label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Your shop name (visible to buyers)"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            This is different from your username. Buyers will see this as your
            store name.
          </p>
        </div>

        {/* Shop Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Shop Description
          </label>
          <textarea
            value={shopDescription}
            onChange={(e) => setShopDescription(e.target.value)}
            placeholder="Tell buyers about your shop, what you sell, delivery times, etc."
            rows={4}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Account Info (read-only) */}
        {profile && (
          <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-4">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Account Info (read-only)
            </p>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Name</dt>
                <dd className="text-slate-300">{profile.fullName || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-300">{profile.email}</dd>
              </div>
            </dl>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
