import mongoose, { Schema, model, models } from "mongoose";

/**
 * Singleton settings document for the platform.
 * key = "main" ensures only one document exists.
 */
export interface ISiteSetting {
  _id: mongoose.Types.ObjectId;
  key: string;
  /** Fee rate for orders below thresholdAmount (e.g. 0.5 means 0.5%). */
  normalTradeFee: number;
  /** Amount threshold in MMK. Orders >= this use thresholdTradeFee. */
  thresholdAmount: number;
  /** Fee rate for orders >= thresholdAmount (e.g. 0.3 means 0.3%). */
  thresholdTradeFee: number;
  updatedAt: Date;
  createdAt: Date;
}

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    key: { type: String, unique: true, default: "main" },
    normalTradeFee: { type: Number, default: 0.5, min: 0 },
    thresholdAmount: { type: Number, default: 100000, min: 0 },
    thresholdTradeFee: { type: Number, default: 0.3, min: 0 },
  },
  { timestamps: true },
);

export const SiteSetting =
  models.SiteSetting ?? model<ISiteSetting>("SiteSetting", siteSettingSchema);

/**
 * Get the current site settings, creating defaults if none exist.
 * Always returns a valid settings object.
 */
export async function getSiteSettings(): Promise<ISiteSetting> {
  let settings = await SiteSetting.findOne({ key: "main" }).lean();
  if (!settings) {
    settings = await SiteSetting.create({ key: "main" });
  }
  return settings as ISiteSetting;
}
