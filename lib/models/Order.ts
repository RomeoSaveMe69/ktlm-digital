import mongoose, { Schema, model, models } from "mongoose";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "disputed";
export type FulfillmentType = "manual" | "api";

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  playerId: string;
  amountMmk: number;
  platformFeeMmk: number;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  apiTransactionId?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    playerId: { type: String, required: true },
    amountMmk: { type: Number, required: true, min: 0 },
    platformFeeMmk: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled", "disputed"],
      default: "pending",
    },
    fulfillmentType: { type: String, enum: ["manual", "api"], default: "manual" },
    apiTransactionId: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1 });
orderSchema.index({ sellerId: 1 });
orderSchema.index({ status: 1 });

export const Order = models.Order ?? model<IOrder>("Order", orderSchema);
