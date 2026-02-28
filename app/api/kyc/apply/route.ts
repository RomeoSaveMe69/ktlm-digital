import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { KYC } from "@/lib/models/KYC";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 500 * 1024; // 500 KB base64 string limit

/** POST /api/kyc/apply – Submit a KYC application to become a seller. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const realName = String(body.realName ?? "").trim();
    const nrcNumber = String(body.nrcNumber ?? "").trim();
    const nrcFrontImage = String(body.nrcFrontImage ?? "").trim();
    const nrcBackImage = String(body.nrcBackImage ?? "").trim();

    if (!realName || !nrcNumber || !nrcFrontImage || !nrcBackImage) {
      return apiError("All fields are required: realName, nrcNumber, nrcFrontImage, nrcBackImage.", 400);
    }

    if (nrcFrontImage.length > MAX_IMAGE_BYTES || nrcBackImage.length > MAX_IMAGE_BYTES) {
      return apiError("Each image must be under 500 KB.", 400);
    }

    await connectDB();

    const user = await User.findById(session.userId).select("role kycStatus").lean();
    if (!user) return apiError("User not found.", 404);

    if (user.role !== "buyer") {
      return apiError("Only buyers can apply for KYC.", 400);
    }

    if (user.kycStatus === "pending") {
      return apiError("You already have a pending KYC application.", 400);
    }

    if (user.kycStatus === "approved") {
      return apiError("Your KYC is already approved.", 400);
    }

    await KYC.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      realName,
      nrcNumber,
      nrcFrontImage,
      nrcBackImage,
      status: "pending",
    });

    await User.findByIdAndUpdate(session.userId, {
      $set: { kycStatus: "pending" },
    });

    return NextResponse.json({ ok: true, message: "KYC application submitted successfully." });
  } catch (err) {
    console.error("KYC apply error:", err);
    return apiError("Failed to submit KYC application.", 500);
  }
}
