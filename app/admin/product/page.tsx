"use client";

/**
 * Admin Product Categories: Filter by Game → Load → Table with Edit/Delete + Add Modal.
 * Persists to DB via /api/admin/product-categories. Sellers can only sell from these categories.
 */

import { useEffect, useRef, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import type { CategoryItem } from "../_context/AdminDataContext";

const ALL_GAMES_VALUE = "";

export default function AdminProductPage() {
  const { games, categories, loadGames, loadCategories } = useAdminData();
  const [selectedGameId, setSelectedGameId] = useState(ALL_GAMES_VALUE);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGames();
    loadCategories();
  }, [loadGames, loadCategories]);

  const filteredCategories: CategoryItem[] =
    selectedGameId === ALL_GAMES_VALUE
      ? categories
      : categories.filter((c) => c.gameId === selectedGameId);

  const selectedGame = selectedGameId
    ? games.find((g) => g.id === selectedGameId)
    : null;

  const handleLoad = () => setLoaded(true);

  const openAddModal = () => {
    setEditingCatId(null);
    setModalTitle("");
    setModalImage(null);
    setImageError(null);
    setError(null);
    setModalOpen(true);
    setTimeout(() => titleInputRef.current?.focus(), 80);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setModalTitle(cat.title);
    setModalImage(cat.image || null);
    setImageError(null);
    setError(null);
    setModalOpen(true);
    setTimeout(() => titleInputRef.current?.focus(), 80);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCatId(null);
    setModalTitle("");
    setModalImage(null);
    setImageError(null);
    setError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      setImageError("File size must be ≤ 300 KB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("Only image files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setModalImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = modalTitle.trim();
    if (!title) return;
    setSaving(true);
    setError(null);
    try {
      if (editingCatId) {
        const res = await fetch(`/api/admin/product-categories/${editingCatId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, image: modalImage ?? "" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Update failed");
        }
      } else {
        const gameId = selectedGameId || (games[0]?.id ?? "");
        if (!gameId) {
          setError("Please select a game first.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/admin/product-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, title, image: modalImage ?? "" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Create failed");
        }
      }
      await loadCategories();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("ဤ Category ကို ဖျက်မည်လား？\nဤ Category ဖြင့် Seller တင်ထားသော Product များပါ ပျက်သွားမည်။"))
      return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/product-categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Product Categories</h2>
        <p className="text-sm text-slate-500">
          Game တစ်ခုချင်းအောက်တွင် Product Category (e.g. 60 UC, 325 UC) သတ်မှတ်ရန်
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filter */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-400">Filter by Game</h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedGameId}
            onChange={(e) => {
              setSelectedGameId(e.target.value);
              setLoaded(false);
            }}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={ALL_GAMES_VALUE}>All Games</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleLoad}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Load Categories
          </button>
        </div>
      </section>

      {/* Table */}
      {loaded && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">
              {selectedGameId === ALL_GAMES_VALUE
                ? "All Categories"
                : selectedGame?.name + " — Categories"}
            </h3>
            {selectedGameId !== ALL_GAMES_VALUE && selectedGame && (
              <button
                type="button"
                onClick={openAddModal}
                disabled={saving}
                className="rounded-lg border border-emerald-500/60 bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-60"
              >
                + Add Category
              </button>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 bg-slate-800/80">
                    <th className="px-4 py-3 font-medium text-slate-400">Image</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Game</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Category</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        {selectedGameId === ALL_GAMES_VALUE
                          ? "No categories. Select a game and add one."
                          : "No categories yet. Click + Add Category."}
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3">
                          {c.image ? (
                            <img
                              src={c.image}
                              alt={c.title}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-600"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-xs text-slate-500">
                              —
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {games.find((g) => g.id === c.gameId)?.name ?? c.gameId}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {c.title}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(c)}
                              disabled={saving}
                              className="text-amber-400 hover:text-amber-300 disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              disabled={saving}
                              className="text-red-400 hover:text-red-300 disabled:opacity-60"
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
      )}

      {!loaded && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-6 py-10 text-center text-slate-500">
          Game ရွေးပြီး &quot;Load Categories&quot; နှိပ်ပါ။
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
            <h3
              id="modal-title"
              className="mb-4 text-lg font-semibold text-slate-100"
            >
              {editingCatId ? "Edit Category" : "Add New Category"}
            </h3>
            {error && (
              <p className="mb-2 text-sm text-red-400">{error}</p>
            )}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Category Title
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. 60 UC, 325 UC, 50 Diamonds"
                  required
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                />
                {!editingCatId && selectedGame && (
                  <p className="mt-1 text-xs text-slate-500">
                    Game: {selectedGame.name}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Category Image (optional, ≤ 300KB)
                </label>
                {modalImage && (
                  <div className="mb-2 flex items-center gap-3">
                    <img
                      src={modalImage}
                      alt="preview"
                      className="h-16 w-16 rounded-lg border border-slate-600 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setModalImage(null)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-sm file:text-slate-300 disabled:opacity-60"
                />
                {imageError && (
                  <p className="mt-1 text-xs text-red-400">{imageError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {saving ? "..." : editingCatId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
