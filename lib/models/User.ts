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
  balance: number;
  withdrawableBalance: number;
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
    /**
     * Seller earnings held in escrow until withdrawal.
     * Incremented when an order is completed (after 0.5% platform fee deduction).
     * Separate from buyer `balance` so each role's funds stay isolated.
     */
    withdrawableBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 });

export const User = models.User ?? model<IUser>("User", userSchema);
