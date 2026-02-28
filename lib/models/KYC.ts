import mongoose, { Schema, model, models } from "mongoose";

export type KycDocStatus = "pending" | "approved" | "rejected";

export interface IKYC {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  realName: string;
  nrcNumber: string;
  nrcFrontImage: string;
  nrcBackImage: string;
  status: KycDocStatus;
  createdAt: Date;
  updatedAt: Date;
}

const kycSchema = new Schema<IKYC>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    realName: { type: String, required: true, trim: true },
    nrcNumber: { type: String, required: true, trim: true },
    nrcFrontImage: { type: String, required: true },
    nrcBackImage: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

kycSchema.index({ status: 1 });

export const KYC = models.KYC ?? model<IKYC>("KYC", kycSchema);
