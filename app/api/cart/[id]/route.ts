import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** DELETE /api/cart/[id] – remove an item from cart. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    await Cart.findOneAndDelete({ _id: id, userId: session.userId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cart DELETE error:", err);
    return apiError("Failed to remove cart item.", 500);
  }
}
