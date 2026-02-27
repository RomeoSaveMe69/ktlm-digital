import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";

export const dynamic = "force-dynamic";

/** GET /api/cart/count – return cart item count for badge display. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ count: 0 });
    await connectDB();
    const count = await Cart.countDocuments({ userId: session.userId });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
