import mongoose, { Schema, model, models } from "mongoose";

export interface IReview {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  reply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true },
    reply: { type: String, trim: true },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1 });
reviewSchema.index({ sellerId: 1 });
reviewSchema.index({ buyerId: 1 });

export const Review = models.Review ?? model<IReview>("Review", reviewSchema);
