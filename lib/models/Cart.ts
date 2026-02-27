import mongoose, { Schema, model, models } from "mongoose";

export interface ICartItem {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  buyerInputData: { label: string; value: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICartItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1, min: 1 },
    buyerInputData: {
      type: [{ label: { type: String }, value: { type: String } }],
      default: [],
    },
  },
  { timestamps: true },
);

cartSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Cart = models.Cart ?? model<ICartItem>("Cart", cartSchema);
