import mongoose, { Schema, model, models } from "mongoose";

export type ProductStatus = "active" | "inactive";

/**
 * Product listing sold by a seller.
 * References: Game, ProductCategory (admin-defined), and User (seller).
 * customTitle: Seller's own display name (e.g. "55+5 UC Fast Delivery").
 */
export interface IProduct {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  productCategoryId: mongoose.Types.ObjectId;
  /** Seller's own display name for this listing. */
  customTitle: string;
  /** Legacy field kept for backward compat. */
  title: string;
  price: number;
  inStock: number;
  deliveryTime: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
    },
    customTitle: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    inStock: { type: Number, required: true, min: 0, default: 0 },
    deliveryTime: { type: String, default: "5-15 min", trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

productSchema.index({ gameId: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ productCategoryId: 1 });
productSchema.index({ status: 1 });

export const Product =
  models.Product ?? model<IProduct>("Product", productSchema);
