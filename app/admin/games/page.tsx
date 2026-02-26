"use client";

/** Admin Games: add game form + game list. Dummy data only. */

import { useState } from "react";

const DUMMY_GAMES = [
  { id: "G1", name: "PUBG Mobile", slug: "pubg-mobile" },
  { id: "G2", name: "Mobile Legends", slug: "mobile-legends" },
];

export default function AdminGamesPage() {
  const [name, setName] = useState("");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Games</h2>
        <p className="text-sm text-slate-500">Admin မှ Game အသစ်ပေါင်းထည့်ရန်</p>
      </div>

      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-sm font-medium text-slate-400">Add Game</h3>
        <form
          className="flex flex-wrap gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setName("");
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Game name (e.g. PUBG)"
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Add Game
          </button>
        </form>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-medium text-slate-400">Game List</h3>
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-400">Name</th>
                <th className="px-4 py-3 font-medium text-slate-400">Slug</th>
                <th className="px-4 py-3 font-medium text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_GAMES.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-200">{g.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{g.slug}</td>
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
