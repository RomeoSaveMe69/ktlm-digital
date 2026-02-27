import mongoose, { Schema, model, models } from "mongoose";

/** P2P role: buyer (default), seller, or admin. */
export type UserRole = "buyer" | "seller" | "admin";
/** KYC status for seller verification. */
export type KycStatus = "pending" | "approved" | "rejected";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName?: string;
  role: UserRole;
  kycStatus: KycStatus;
  telegramChatId?: string;
  telegramUsername?: string;
  /** Buyer: spendable deposit balance. Seller: transferred from withdrawableBalance via exchange. */
  balance: number;
  /** Seller: confirmed sale earnings available for withdrawal or exchange. */
  withdrawableBalance: number;
  /** Seller: money from sent (but not yet buyer-confirmed) orders. */
  pendingBalance: number;
  /** Seller: money submitted for withdrawal, awaiting admin approval. */
  withdrawPendingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, trim: true },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    telegramChatId: { type: String },
    telegramUsername: { type: String, trim: true },
    balance: { type: Number, default: 0, min: 0 },
    withdrawableBalance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    withdrawPendingBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 });

export const User = models.User ?? model<IUser>("User", userSchema);
