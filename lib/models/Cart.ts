import mongoose, { Schema, model, models } from "mongoose";

/**
 * Cart: items a buyer has added but not yet purchased.
 * quantity is fixed at 1 for digital goods (each order = 1 unit).
 */
export interface ICart {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

cartSchema.index({ userId: 1 });
cartSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Cart = models.Cart ?? model<ICart>("Cart", cartSchema);
