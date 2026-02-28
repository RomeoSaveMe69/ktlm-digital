import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { KYC } from "@/lib/models/KYC";
import { User } from "@/lib/models/User";
import { getNextSid } from "@/lib/models/Counter";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/kyc/[id] – Approve or reject a KYC application. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError("Invalid KYC id.", 400);
    }

    const body = await request.json();
    const action = String(body.action ?? "").trim().toLowerCase();

    if (action !== "approve" && action !== "reject") {
      return apiError("Action must be 'approve' or 'reject'.", 400);
    }

    await connectDB();

    const kyc = await KYC.findById(id);
    if (!kyc) return apiError("KYC application not found.", 404);

    if (kyc.status !== "pending") {
      return apiError(`This application has already been ${kyc.status}.`, 400);
    }

    if (action === "approve") {
      kyc.status = "approved";
      await kyc.save();

      const user = await User.findById(kyc.userId);
      if (user) {
        user.kycStatus = "approved";
        user.role = "seller";
        if (!user.sid) {
          user.sid = await getNextSid();
        }
        await user.save();
      }

      return NextResponse.json({
        ok: true,
        message: "KYC approved. User is now a seller.",
        kycStatus: "approved",
      });
    } else {
      kyc.status = "rejected";
      await kyc.save();

      await User.findByIdAndUpdate(kyc.userId, {
        $set: { kycStatus: "rejected" },
      });

      return NextResponse.json({
        ok: true,
        message: "KYC rejected.",
        kycStatus: "rejected",
      });
    }
  } catch (err) {
    console.error("Admin KYC action error:", err);
    return apiError("Failed to process KYC application.", 500);
  }
}
