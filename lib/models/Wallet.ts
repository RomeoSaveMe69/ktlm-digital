import mongoose, { Schema, model, models } from "mongoose";

export type WalletCurrency = "MMK" | "USDT";

export interface IWallet {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  currency: WalletCurrency;
  balance: number;
  escrowBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currency: { type: String, enum: ["MMK", "USDT"], required: true },
    balance: { type: Number, default: 0, min: 0 },
    escrowBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

walletSchema.index({ userId: 1, currency: 1 }, { unique: true });

export const Wallet = models.Wallet ?? model<IWallet>("Wallet", walletSchema);
