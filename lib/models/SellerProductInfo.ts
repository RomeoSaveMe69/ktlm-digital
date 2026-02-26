import mongoose, { Schema, model, models } from "mongoose";

/**
 * SellerProductInfo: Seller's cost-basis info for a product category.
 * Links a Game + ProductCategory to a cost amount and a SellerCurrency.
 * Used by auto-pricing to calculate the final selling price.
 */
export interface ISellerProductInfo {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  productCategoryId: mongoose.Types.ObjectId;
  costAmount: number;
  currencyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sellerProductInfoSchema = new Schema<ISellerProductInfo>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    productCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
    },
    costAmount: { type: Number, required: true, min: 0 },
    currencyId: {
      type: Schema.Types.ObjectId,
      ref: "SellerCurrency",
      required: true,
    },
  },
  { timestamps: true },
);

sellerProductInfoSchema.index({ sellerId: 1 });
sellerProductInfoSchema.index({ sellerId: 1, productCategoryId: 1 });

export const SellerProductInfo =
  models.SellerProductInfo ??
  model<ISellerProductInfo>("SellerProductInfo", sellerProductInfoSchema);
