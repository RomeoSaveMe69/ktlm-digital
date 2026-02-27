import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/users/[id]/status
 * Update a user's account status.
 * Body: { status: "ACTIVE" | "SUSPENDED" | "BANNED", suspendedUntil?: string (ISO date) }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid user id", 400);
    }

    const body = await request.json();
    const { status, suspendedUntil } = body;

    if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      return apiError("Status must be ACTIVE, SUSPENDED, or BANNED", 400);
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) return apiError("User not found", 404);

    // Prevent admins from banning themselves or other admins
    if (user.role === "admin" && status !== "ACTIVE") {
      return apiError("Cannot suspend or ban admin accounts", 400);
    }

    const update: Record<string, unknown> = { status };

    if (status === "SUSPENDED") {
      if (!suspendedUntil) {
        return apiError("suspendedUntil date is required for suspension", 400);
      }
      const until = new Date(suspendedUntil);
      if (isNaN(until.getTime()) || until <= new Date()) {
        return apiError("suspendedUntil must be a future date", 400);
      }
      update.suspendedUntil = until;
    } else {
      update.suspendedUntil = null;
    }

    const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select("-passwordHash")
      .lean();

    return NextResponse.json({
      ok: true,
      user: {
        id: updated!._id.toString(),
        status: updated!.status,
        suspendedUntil: updated!.suspendedUntil ?? null,
      },
    });
  } catch (err) {
    console.error("Admin user status update error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
