"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type GameResult = { id: string; title: string; image: string };

function useDebounce(value: string, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.games ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative mx-auto max-w-xl">
      <label htmlFor="hero-search" className="sr-only">
        Search games or items
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          aria-hidden
        >
          🔍
        </span>
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="e.g. MLBB, 100 Diamonds, PUBG UC..."
          autoComplete="off"
          className="w-full rounded-2xl border border-slate-700/80 bg-slate-800/80 py-4 pl-12 pr-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            ...
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-800/95 shadow-2xl backdrop-blur-md">
          {results.map((g) => (
            <li key={g.id}>
              <Link
                href={`/game/${g.id}`}
                onClick={() => { setOpen(false); setQuery(""); }}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-700/60"
              >
                {g.image ? (
                  <img
                    src={g.image}
                    alt={g.title}
                    className="h-8 w-8 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/50 text-lg">
                    🎮
                  </span>
                )}
                <span className="text-sm font-medium text-slate-200">
                  {g.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {open && debouncedQuery.trim() && results.length === 0 && !loading && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-slate-700/80 bg-slate-800/95 px-4 py-4 text-center text-sm text-slate-500 shadow-2xl">
          No games found for &ldquo;{debouncedQuery}&rdquo;
        </div>
      )}
    </div>
  );
}
