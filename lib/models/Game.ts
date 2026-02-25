import mongoose, { Schema, model, models } from "mongoose";

/**
 * Game model for P2P marketplace (e.g. MLBB, PUBG, Free Fire).
 * Products are listed under a Game.
 */
export interface IGame {
  _id: mongoose.Types.ObjectId;
  title: string;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema<IGame>(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

gameSchema.index({ title: 1 });

export const Game = models.Game ?? model<IGame>("Game", gameSchema);
