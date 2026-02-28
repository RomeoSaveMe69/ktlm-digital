"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_IMAGE_BYTES = 500 * 1024;

export function KycApplyModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [realName, setRealName] = useState("");
  const [nrcNumber, setNrcNumber] = useState("");
  const [nrcFrontPreview, setNrcFrontPreview] = useState<string | null>(null);
  const [nrcBackPreview, setNrcBackPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  function handleImage(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string | null) => void,
  ) {
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
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!realName.trim() || !nrcNumber.trim()) {
      setError("Real Name and NRC Number are required.");
      return;
    }
    if (!nrcFrontPreview || !nrcBackPreview) {
      setError("Both NRC front and back images are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/kyc/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realName: realName.trim(),
          nrcNumber: nrcNumber.trim(),
          nrcFrontImage: nrcFrontPreview,
          nrcBackImage: nrcBackPreview,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed.");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-100">
            Apply to Become a Seller
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-5">
          Complete the KYC verification below. Your application will be reviewed
          by our admin team.
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {imageError && (
          <p className="mb-4 rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-400">
            {imageError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Real Name
            </label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="Enter your full legal name"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              NRC Number
            </label>
            <input
              type="text"
              value={nrcNumber}
              onChange={(e) => setNrcNumber(e.target.value)}
              placeholder="e.g. 12/TaMaNa(N)123456"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              NRC Front Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImage(e, setNrcFrontPreview)}
              className="w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-300 hover:file:bg-slate-600"
            />
            {nrcFrontPreview && (
              <img
                src={nrcFrontPreview}
                alt="NRC Front Preview"
                className="mt-2 h-32 w-auto rounded-lg border border-slate-700 object-contain"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              NRC Back Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImage(e, setNrcBackPreview)}
              className="w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-300 hover:file:bg-slate-600"
            />
            {nrcBackPreview && (
              <img
                src={nrcBackPreview}
                alt="NRC Back Preview"
                className="mt-2 h-32 w-auto rounded-lg border border-slate-700 object-contain"
              />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-600 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
