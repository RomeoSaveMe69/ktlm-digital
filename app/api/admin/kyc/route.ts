import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { KYC } from "@/lib/models/KYC";
import { apiError } from "@/lib/api-utils";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/** GET /api/admin/kyc – List all KYC applications (pending first). */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Forbidden", 403);
    }

    await connectDB();

    const applications = await KYC.find()
      .populate("userId", "email fullName bid role kycStatus")
      .sort({ status: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      applications: applications.map((app) => {
        const user = app.userId as {
          _id?: { toString(): string };
          email?: string;
          fullName?: string;
          bid?: string;
          role?: string;
          kycStatus?: string;
        } | null;
        return {
          id: app._id.toString(),
          userId: user?._id?.toString?.() ?? "",
          userEmail: user?.email ?? "",
          userName: user?.fullName ?? "",
          userBid: user?.bid ?? "",
          userRole: user?.role ?? "",
          userKycStatus: user?.kycStatus ?? "",
          realName: app.realName,
          nrcNumber: app.nrcNumber,
          nrcFrontImage: app.nrcFrontImage,
          nrcBackImage: app.nrcBackImage,
          status: app.status,
          createdAt: app.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error("Admin KYC list error:", err);
    return apiError("Failed to load KYC applications.", 500);
  }
}
