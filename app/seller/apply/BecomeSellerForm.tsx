"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX_IMAGE_BYTES = 500 * 1024;

export function BecomeSellerForm() {
  const router = useRouter();
  const [realName, setRealName] = useState("");
  const [nrcNumber, setNrcNumber] = useState("");
  const [nrcFrontPreview, setNrcFrontPreview] = useState<string | null>(null);
  const [nrcBackPreview, setNrcBackPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <p className="text-emerald-400 font-medium">
          Application submitted successfully!
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Your KYC application is now pending review. We will notify you once
          it has been processed.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 space-y-5"
    >
      {error && (
        <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {imageError && (
        <p className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-400">
          {imageError}
        </p>
      )}

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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit KYC Application"}
      </button>
    </form>
  );
}
