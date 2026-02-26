"use client";

/**
 * Admin Product (Packages): Filter by Game → Load → Table with Edit/Delete + Add New Package modal.
 * Master concept: Sellers can only sell Admin-created packages. Deleting a game cascades to packages (see Games page).
 */

import { useRef, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import type { PackageItem } from "../_context/AdminDataContext";

const ALL_GAMES_VALUE = "";

function generatePackageId() {
  return "P" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function AdminProductPage() {
  const { games, packages, addPackage, updatePackage, deletePackage } = useAdminData();
  const [selectedGameId, setSelectedGameId] = useState(ALL_GAMES_VALUE);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [modalName, setModalName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const filteredPackages = selectedGameId === ALL_GAMES_VALUE
    ? packages
    : packages.filter((p) => p.gameId === selectedGameId);

  const handleLoad = () => setLoaded(true);

  const openAddModal = () => {
    setEditingPackageId(null);
    setModalName("");
    setModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const openEditModal = (pkg: PackageItem) => {
    setEditingPackageId(pkg.id);
    setModalName(pkg.name);
    setModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPackageId(null);
    setModalName("");
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = modalName.trim();
    if (!name) return;
    if (editingPackageId) {
      updatePackage(editingPackageId, { name });
    } else {
      const gameId = selectedGameId || (games[0]?.id ?? "");
      if (!gameId) return;
      addPackage({ id: generatePackageId(), gameId, name });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("ဤ Package ကို ဖျက်မည်လား？")) return;
    deletePackage(id);
  };

  const selectedGame = selectedGameId ? games.find((g) => g.id === selectedGameId) : null;
  const canAddPackage = selectedGameId !== ALL_GAMES_VALUE && selectedGame;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Product (Packages)</h2>
        <p className="text-sm text-slate-500">Game တစ်ခုချင်းစီအောက်တွင် Package (e.g. 60 UC, 325 UC) သတ်မှတ်ရန်</p>
      </div>

      {/* Step 1: Filter */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-400">Filter</h3>
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
            Load Packages
          </button>
        </div>
      </section>

      {/* Step 2: Table (after Load) */}
      {loaded && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">
              {selectedGameId === ALL_GAMES_VALUE ? "All Packages" : selectedGame?.name + " — Packages"}
            </h3>
            {canAddPackage && (
              <button
                type="button"
                onClick={openAddModal}
                className="rounded-lg border border-emerald-500/60 bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-600/30"
              >
                Add New Product
              </button>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 bg-slate-800/80">
                    <th className="px-4 py-3 font-medium text-slate-400">Game</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Package</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        {selectedGameId === ALL_GAMES_VALUE
                          ? "No packages. Select a game and add one."
                          : "No packages for this game. Click Add New Product."}
                      </td>
                    </tr>
                  ) : (
                    filteredPackages.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3 text-slate-400">
                          {games.find((g) => g.id === p.gameId)?.name ?? p.gameId}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="text-amber-400 hover:text-amber-300"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
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
      )}

      {!loaded && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-6 py-10 text-center text-slate-500">
          Game ရွေးပြီး &quot;Load Packages&quot; နှိပ်ပါ။
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
            <h3 id="modal-title" className="mb-4 text-lg font-semibold text-slate-100">
              {editingPackageId ? "Edit Package" : "Add New Package"}
            </h3>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">Package Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. 60 UC, 325 UC"
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {!editingPackageId && selectedGame && (
                  <p className="mt-1 text-xs text-slate-500">Game: {selectedGame.name}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  {editingPackageId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
