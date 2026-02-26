"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

/** Game from DB. */
export type GameItem = {
  id: string;
  name: string;
  description: string;
  imagePreviewUrl: string | null;
};

/** ProductCategory: Admin-defined under a game (e.g. "60 UC"). */
export type CategoryItem = {
  id: string;
  gameId: string;
  title: string;
};

type AdminDataContextValue = {
  games: GameItem[];
  categories: CategoryItem[];
  setGames: React.Dispatch<React.SetStateAction<GameItem[]>>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  loadGames: () => Promise<void>;
  loadCategories: () => Promise<void>;
  deleteGame: (gameId: string) => void;
  addGame: (game: GameItem) => void;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<GameItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const loadGames = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/games");
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.games ?? []).map(
        (g: {
          id: string;
          name?: string;
          title?: string;
          description?: string;
          image?: string | null;
        }) => ({
          id: g.id,
          name: g.name ?? g.title ?? "",
          description: g.description ?? "",
          imagePreviewUrl: g.image ?? null,
        })
      );
      setGames(list);
    } catch (e) {
      console.error("loadGames:", e);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/product-categories");
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.categories ?? []).map(
        (c: { id: string; gameId: string; title: string }) => ({
          id: c.id,
          gameId: c.gameId,
          title: c.title,
        })
      );
      setCategories(list);
    } catch (e) {
      console.error("loadCategories:", e);
    }
  }, []);

  const deleteGame = useCallback((gameId: string) => {
    setGames((prev) => prev.filter((g) => g.id !== gameId));
    setCategories((prev) => prev.filter((c) => c.gameId !== gameId));
  }, []);

  const addGame = useCallback((game: GameItem) => {
    setGames((prev) => [...prev, game]);
  }, []);

  const value: AdminDataContextValue = {
    games,
    categories,
    setGames,
    setCategories,
    loadGames,
    loadCategories,
    deleteGame,
    addGame,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx)
    throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
