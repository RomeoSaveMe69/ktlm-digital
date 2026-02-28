import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { uploadImage } from "@/lib/cloudinary";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 500 * 1024;

/** GET /api/seller/profile/update – Fetch current seller profile data. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const user = await User.findById(session.userId)
      .select("profileImage shopName shopDescription fullName email")
      .lean();

    if (!user) return apiError("User not found.", 404);

    return NextResponse.json({
      profile: {
        profileImage: user.profileImage ?? "",
        shopName: user.shopName ?? "",
        shopDescription: user.shopDescription ?? "",
        fullName: user.fullName ?? "",
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Seller profile GET error:", err);
    return apiError("Failed to load profile.", 500);
  }
}

/** PATCH /api/seller/profile/update – Update seller shop profile. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const updates: Record<string, string> = {};

    if (typeof body.shopName === "string") {
      updates.shopName = body.shopName.trim();
    }
    if (typeof body.shopDescription === "string") {
      updates.shopDescription = body.shopDescription.trim();
    }
    if (typeof body.profileImage === "string" && body.profileImage) {
      if (body.profileImage.startsWith("data:")) {
        if (body.profileImage.length > MAX_IMAGE_BYTES) {
          return apiError("Profile image must be under 500 KB.", 400);
        }
        updates.profileImage = await uploadImage(body.profileImage, "profiles");
      } else {
        updates.profileImage = body.profileImage;
      }
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No valid fields provided to update.", 400);
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.userId,
      { $set: updates },
      { new: true },
    ).select("profileImage shopName shopDescription");

    if (!user) return apiError("User not found.", 404);

    return NextResponse.json({
      ok: true,
      profile: {
        profileImage: user.profileImage ?? "",
        shopName: user.shopName ?? "",
        shopDescription: user.shopDescription ?? "",
      },
    });
  } catch (err) {
    console.error("Seller profile update error:", err);
    return apiError("Failed to update profile.", 500);
  }
}
