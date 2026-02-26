import mongoose, { Schema, model, models } from "mongoose";

/**
 * Package (admin-defined product under a game), e.g. "60 UC", "325 UC".
 * Sellers can only list products from these packages.
 */
export interface IPackage {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackage>(
  {
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

packageSchema.index({ gameId: 1 });

export const GamePackage =
  models.GamePackage ?? model<IPackage>("GamePackage", packageSchema);
