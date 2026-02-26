import mongoose, { Schema, model, models } from "mongoose";

/**
 * DepositRequest: A user's deposit/recharge request awaiting admin approval.
 * On approval, the user's balance is incremented by `amount`.
 * screenshot is base64-encoded (max 300KB enforced on client).
 */
export type DepositStatus = "pending" | "approved" | "rejected";

export interface IDepositRequest {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethodId: mongoose.Types.ObjectId;
  transactionId: string;
  screenshot?: string;
  status: DepositStatus;
  createdAt: Date;
  updatedAt: Date;
}

const depositRequestSchema = new Schema<IDepositRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethodId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },
    transactionId: { type: String, required: true, trim: true },
    screenshot: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

depositRequestSchema.index({ status: 1 });
depositRequestSchema.index({ userId: 1 });

export const DepositRequest =
  models.DepositRequest ??
  model<IDepositRequest>("DepositRequest", depositRequestSchema);
