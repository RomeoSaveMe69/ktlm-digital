import mongoose, { Schema, model, models } from "mongoose";

/**
 * PaymentMethod: Admin-defined payment channels for user deposits.
 * type 'account' → shows accountName + accountNumber.
 * type 'qr'      → shows shopName + qrImage (base64).
 */
export type PaymentMethodType = "account" | "qr";

export interface IPaymentMethod {
  _id: mongoose.Types.ObjectId;
  type: PaymentMethodType;
  methodName: string;
  accountName?: string;
  accountNumber?: string;
  shopName?: string;
  qrImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    type: {
      type: String,
      enum: ["account", "qr"],
      required: true,
    },
    methodName: { type: String, required: true, trim: true },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    shopName: { type: String, trim: true },
    qrImage: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

paymentMethodSchema.index({ isActive: 1 });

export const PaymentMethod =
  models.PaymentMethod ??
  model<IPaymentMethod>("PaymentMethod", paymentMethodSchema);
