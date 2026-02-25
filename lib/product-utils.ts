/**
 * Safe mapping from Product document (old or new schema) to a consistent shape.
 * Prevents crashes when DB has legacy products (name, gameName, priceMmk, isActive)
 * alongside new schema (title, gameId, price, inStock, status).
 */

type RawProduct = Record<string, unknown> & {
  _id: { toString(): string };
  gameId?: unknown;
  sellerId?: unknown;
  gameName?: string;
  title?: string;
  name?: string;
  price?: number;
  priceMmk?: number;
  inStock?: number;
  deliveryTime?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: unknown;
};

function getGameTitle(p: RawProduct): string {
  const g = p.gameId as { title?: string } | null | undefined;
  if (g && typeof g.title === "string") return g.title;
  if (typeof p.gameName === "string") return p.gameName;
  return "";
}

export function mapProductToSafeShape(p: RawProduct) {
  return {
    id: p._id?.toString?.() ?? "",
    title: typeof p.title === "string" ? p.title : ((p.name as string) ?? "—"),
    gameTitle: getGameTitle(p) || "Unknown Game",
    price: typeof p.price === "number" ? p.price : Number(p.priceMmk) || 0,
    inStock: typeof p.inStock === "number" ? p.inStock : 0,
    deliveryTime: typeof p.deliveryTime === "string" ? p.deliveryTime : "",
    status:
      p.status === "active" || p.status === "inactive"
        ? p.status
        : p.isActive === true
          ? "active"
          : "inactive",
    createdAt: p.createdAt,
  };
}
