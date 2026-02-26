"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

/** Game: Admin-created. Deleting a game cascades to all its packages (API note). */
export type GameItem = {
  id: string;
  name: string;
  description: string;
  imagePreviewUrl: string | null; // object URL or null
};

/** Package (Product): Admin-created under a game. Sellers can only sell these. */
export type PackageItem = {
  id: string;
  gameId: string;
  name: string;
};

const INITIAL_GAMES: GameItem[] = [
  { id: "G1", name: "PUBG Mobile", description: "Global Server, UID Only", imagePreviewUrl: null },
  { id: "G2", name: "Mobile Legends", description: "Global Server", imagePreviewUrl: null },
];

const INITIAL_PACKAGES: PackageItem[] = [
  { id: "P1", gameId: "G1", name: "60 UC" },
  { id: "P2", gameId: "G1", name: "325 UC" },
  { id: "P3", gameId: "G2", name: "50 Diamonds" },
];

type AdminDataContextValue = {
  games: GameItem[];
  packages: PackageItem[];
  setGames: React.Dispatch<React.SetStateAction<GameItem[]>>;
  setPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>;
  /** Cascade: remove game and all its packages. Use when API implements delete game. */
  deleteGame: (gameId: string) => void;
  addGame: (game: GameItem) => void;
  updateGame: (id: string, game: Partial<GameItem>) => void;
  addPackage: (pkg: PackageItem) => void;
  updatePackage: (id: string, pkg: Partial<PackageItem>) => void;
  deletePackage: (id: string) => void;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<GameItem[]>(INITIAL_GAMES);
  const [packages, setPackages] = useState<PackageItem[]>(INITIAL_PACKAGES);

  const deleteGame = useCallback((gameId: string) => {
    setGames((prev) => prev.filter((g) => g.id !== gameId));
    setPackages((prev) => prev.filter((p) => p.gameId !== gameId));
  }, []);

  const addGame = useCallback((game: GameItem) => {
    setGames((prev) => [...prev, game]);
  }, []);

  const updateGame = useCallback((id: string, updates: Partial<GameItem>) => {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  }, []);

  const addPackage = useCallback((pkg: PackageItem) => {
    setPackages((prev) => [...prev, pkg]);
  }, []);

  const updatePackage = useCallback((id: string, updates: Partial<PackageItem>) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePackage = useCallback((id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value: AdminDataContextValue = {
    games,
    packages,
    setGames,
    setPackages,
    deleteGame,
    addGame,
    updateGame,
    addPackage,
    updatePackage,
    deletePackage,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
