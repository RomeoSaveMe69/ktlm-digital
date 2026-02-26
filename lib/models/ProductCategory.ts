import mongoose, { Schema, model, models } from "mongoose";

/**
 * ProductCategory: Admin-defined product type under a game.
 * Examples: "60 UC", "325 UC" under PUBG Mobile.
 * Sellers can only list products referencing these categories.
 */
export interface IProductCategory {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const productCategorySchema = new Schema<IProductCategory>(
  {
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

productCategorySchema.index({ gameId: 1 });

export const ProductCategory =
  models.ProductCategory ??
  model<IProductCategory>("ProductCategory", productCategorySchema);
