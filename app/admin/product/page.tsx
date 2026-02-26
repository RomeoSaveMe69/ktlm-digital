"use client";

/** Admin Product: set products under each game (e.g. 60 UC, 325 UC). UI shell. */

import { useState } from "react";

const DUMMY_GAMES = [
  { id: "G1", name: "PUBG Mobile" },
  { id: "G2", name: "Mobile Legends" },
];

const DUMMY_PRODUCTS: { id: string; gameId: string; name: string }[] = [
  { id: "P1", gameId: "G1", name: "60 UC" },
  { id: "P2", gameId: "G1", name: "325 UC" },
  { id: "P3", gameId: "G2", name: "50 Diamonds" },
];

export default function AdminProductPage() {
  const [selectedGame, setSelectedGame] = useState("");
  const [productName, setProductName] = useState("");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Product</h2>
        <p className="text-sm text-slate-500">Game တစ်ခုချင်းစီအောက်တွင် Admin မှ Product (e.g. 60 UC) သတ်မှတ်ရန်</p>
      </div>

      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-sm font-medium text-slate-400">Add Product under Game</h3>
        <form
          className="flex flex-wrap gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setProductName("");
          }}
        >
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select Game</option>
            {DUMMY_GAMES.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name (e.g. 60 UC)"
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Add Product
          </button>
        </form>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-medium text-slate-400">Product List (by Game)</h3>
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-400">Game</th>
                <th className="px-4 py-3 font-medium text-slate-400">Product</th>
                <th className="px-4 py-3 font-medium text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_PRODUCTS.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 text-slate-400">
                    {DUMMY_GAMES.find((g) => g.id === p.gameId)?.name ?? p.gameId}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-amber-400 hover:text-amber-300">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
