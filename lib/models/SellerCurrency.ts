import mongoose, { Schema, model, models } from "mongoose";

/**
 * SellerCurrency: A seller's custom exchange currency used for auto-pricing.
 * e.g. name="USDT", rate=4000 (MMK per 1 USDT), profitMargin=2 (2%).
 */
export interface ISellerCurrency {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  name: string;
  rate: number;
  profitMargin: number;
  createdAt: Date;
  updatedAt: Date;
}

const sellerCurrencySchema = new Schema<ISellerCurrency>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    profitMargin: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

sellerCurrencySchema.index({ sellerId: 1 });

export const SellerCurrency =
  models.SellerCurrency ??
  model<ISellerCurrency>("SellerCurrency", sellerCurrencySchema);
