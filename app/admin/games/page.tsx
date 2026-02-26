"use client";

/**
 * Admin Games: Add/Edit Game form (Name, Image ≤300KB, Description) + Game List.
 * Master concept: Deleting a game cascades to all its packages (API: cascade delete).
 */

import { useCallback, useRef, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import type { GameItem } from "../_context/AdminDataContext";

const MAX_IMAGE_BYTES = 300 * 1024; // 300 KB

function generateId() {
  return "G" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function AdminGamesPage() {
  const { games, addGame, updateGame, deleteGame } = useAdminData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName("");
    setDescription("");
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
    fileInputRef.current?.setAttribute("value", "");
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`ဖိုင်ဆိုဒ် 300 KB ထက် မကျော်ရပါ။ (လက်ရှိ ${(file.size / 1024).toFixed(1)} KB)`);
      setImageFile(null);
      setImagePreviewUrl(null);
      e.target.value = "";
      return;
    }
    setImageFile(file);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPreview = imagePreviewUrl ?? (editingId ? games.find((g) => g.id === editingId)?.imagePreviewUrl ?? null : null);
    if (editingId) {
      updateGame(editingId, { name: name.trim(), description: description.trim(), imagePreviewUrl: finalPreview });
    } else {
      addGame({
        id: generateId(),
        name: name.trim(),
        description: description.trim(),
        imagePreviewUrl: finalPreview,
      });
    }
    resetForm();
  };

  const handleEdit = (g: GameItem) => {
    setEditingId(g.id);
    setName(g.name);
    setDescription(g.description);
    setImageFile(null);
    setImageError(null);
    if (g.imagePreviewUrl) setImagePreviewUrl(g.imagePreviewUrl);
    else setImagePreviewUrl(null);
  };

  const handleDelete = (gameId: string) => {
    if (typeof window !== "undefined" && !window.confirm("ဤ Game ကို ဖျက်မည်လား？ သက်ဆိုင်သော Package များပါ ပျက်သွားမည်။")) return;
    deleteGame(gameId);
    if (editingId === gameId) resetForm();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Games</h2>
        <p className="text-sm text-slate-500">Admin မှ Game အသစ်ပေါင်းထည့်ရန် / ပြင်ဆင်ရန်</p>
      </div>

      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-sm font-medium text-slate-400">
          {editingId ? "Edit Game" : "Add Game"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Game Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PUBG Mobile"
              required
              className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Game Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full max-w-md text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-500">အများဆုံး 300 KB (Database/Storage နေရာမစားစေရန်)</p>
            {imageError && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {imageError}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Global Server, UID Only"
              rows={3}
              className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              {editingId ? "Update Game" : "Add Game"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-medium text-slate-400">Game List</h3>
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-800/80">
                  <th className="px-4 py-3 font-medium text-slate-400">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Image Preview</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Description</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {games.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No games yet. Add one above.
                    </td>
                  </tr>
                ) : (
                  games.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-200">{g.name}</td>
                      <td className="px-4 py-3">
                        {g.imagePreviewUrl ? (
                          <img
                            src={g.imagePreviewUrl}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 text-slate-500 text-xs">
                            No img
                          </span>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-400" title={g.description}>
                        {g.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(g)}
                            className="text-amber-400 hover:text-amber-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(g.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
