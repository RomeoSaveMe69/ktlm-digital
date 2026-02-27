import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SiteSetting, getSiteSettings } from "@/lib/models/SiteSetting";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/** GET /api/admin/settings – return current site settings. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }
    await connectDB();
    const settings = await getSiteSettings();
    return NextResponse.json({
      settings: {
        normalTradeFee: settings.normalTradeFee,
        thresholdAmount: settings.thresholdAmount,
        thresholdTradeFee: settings.thresholdTradeFee,
      },
    });
  } catch (err) {
    console.error("Admin settings GET error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}

/** PATCH /api/admin/settings – update site settings. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }
    await connectDB();

    const body = await request.json();
    const update: Record<string, number> = {};

    if (body.normalTradeFee !== undefined) {
      const v = Number(body.normalTradeFee);
      if (isNaN(v) || v < 0 || v > 100)
        return apiError("normalTradeFee must be 0-100", 400);
      update.normalTradeFee = v;
    }
    if (body.thresholdAmount !== undefined) {
      const v = Number(body.thresholdAmount);
      if (isNaN(v) || v < 0)
        return apiError("thresholdAmount must be >= 0", 400);
      update.thresholdAmount = v;
    }
    if (body.thresholdTradeFee !== undefined) {
      const v = Number(body.thresholdTradeFee);
      if (isNaN(v) || v < 0 || v > 100)
        return apiError("thresholdTradeFee must be 0-100", 400);
      update.thresholdTradeFee = v;
    }

    if (Object.keys(update).length === 0) {
      return apiError("No valid fields to update", 400);
    }

    const settings = await SiteSetting.findOneAndUpdate(
      { key: "main" },
      { $set: update },
      { new: true, upsert: true },
    ).lean();

    return NextResponse.json({
      settings: {
        normalTradeFee: settings!.normalTradeFee,
        thresholdAmount: settings!.thresholdAmount,
        thresholdTradeFee: settings!.thresholdTradeFee,
      },
    });
  } catch (err) {
    console.error("Admin settings PATCH error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
