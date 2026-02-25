import mongoose, { Schema, model, models } from "mongoose";

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  name: string;
  gameName: string;
  priceMmk: number;
  fulfillmentType: "manual" | "api";
  apiProvider?: string;
  apiProductId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    gameName: { type: String, required: true },
    priceMmk: { type: Number, required: true, min: 0 },
    fulfillmentType: {
      type: String,
      enum: ["manual", "api"],
      default: "manual",
    },
    apiProvider: { type: String },
    apiProductId: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product =
  models.Product ?? model<IProduct>("Product", productSchema);
