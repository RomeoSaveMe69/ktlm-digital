import mongoose, { Schema, model, models, type HydratedDocument } from "mongoose";

/**
 * Order status flow:
 *   pending → processing → sent → completed
 *                              ↘ cancelled (any time before sent)
 *
 * Escrow settlement:
 *   On 'completed': seller receives price * (1 - PLATFORM_FEE_RATE).
 *   On 'sent': sentAt is set; 24h auto-complete timer starts.
 *
 * Future "Fastest Function" readiness:
 *   sellerId is indexed. Adding sellerPendingCount query support
 *   requires only counting pending orders per seller — no schema changes needed.
 */
export type OrderStatus =
  | "pending"
  | "processing"
  | "sent"
  | "completed"
  | "cancelled";

/** A single buyer-provided input value at checkout (e.g. { label: "UID", value: "12345678" }). */
export interface IBuyerInputData {
  label: string;
  value: string;
}

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  /** Human-readable unique order identifier (e.g. "ORD-AbCdEfGhIj"). */
  orderId: string;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  /** Number of units purchased in this order. */
  quantity: number;
  /** Selling price at time of order (snapshot). */
  price: number;
  /** Platform fee (0.5% of price). Legacy alias, kept for backward compat. */
  platformFee: number;
  /** Amount credited to seller on completion = price - platformFee. Legacy alias. */
  sellerAmount: number;
  /** Trade fee calculated from SiteSetting at time of seller sending. */
  feeAmount: number;
  /** Net amount seller receives = price - feeAmount. */
  sellerReceivedAmount: number;
  /** Buyer-filled form data at checkout (dynamic, from product.buyerInputs). */
  buyerInputData: IBuyerInputData[];
  status: OrderStatus;
  /** Set when seller marks 'sent'. 24h auto-complete timer starts from this timestamp. */
  sentAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      unique: true,
    },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    sellerAmount: { type: Number, default: 0, min: 0 },
    feeAmount: { type: Number, default: 0, min: 0 },
    sellerReceivedAmount: { type: Number, default: 0, min: 0 },
    buyerInputData: {
      type: [
        {
          label: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "completed", "cancelled"],
      default: "pending",
    },
    sentAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

orderSchema.index({ buyerId: 1 });
orderSchema.index({ sellerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ sentAt: 1, status: 1 });

export const Order = models.Order ?? model<IOrder>("Order", orderSchema);
