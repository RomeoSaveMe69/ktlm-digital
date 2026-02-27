import mongoose, { Schema, model, models } from "mongoose";

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export interface IWithdrawalRequest {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: string;
  accountName: string;
  paymentNumber: string;
  status: WithdrawalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    paymentNumber: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

withdrawalRequestSchema.index({ sellerId: 1 });
withdrawalRequestSchema.index({ status: 1 });

export const WithdrawalRequest =
  models.WithdrawalRequest ??
  model<IWithdrawalRequest>("WithdrawalRequest", withdrawalRequestSchema);
