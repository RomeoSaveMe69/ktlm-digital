import mongoose, { Schema, model, models } from "mongoose";

/**
 * Auto-increment counter collection.
 * Each document tracks the current sequence value for a named counter (e.g. "bid", "sid").
 */
export interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter =
  models.Counter ?? model<ICounter>("Counter", counterSchema);

/**
 * Atomically increment and return the next sequence number for a counter.
 * Creates the counter document if it doesn't exist.
 */
async function getNextSequence(name: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter!.seq;
}

/** Generate next BID like "BID0000001" (7-digit zero-padded). */
export async function getNextBid(): Promise<string> {
  const seq = await getNextSequence("bid");
  return `BID${String(seq).padStart(7, "0")}`;
}

/** Generate next SID like "SID0000001" (7-digit zero-padded). */
export async function getNextSid(): Promise<string> {
  const seq = await getNextSequence("sid");
  return `SID${String(seq).padStart(7, "0")}`;
}

/**
 * Generate next OID like "OID-A-0000001".
 * When number reaches 9999999, reset to 1 and increment the letter.
 */
export async function getNextOid(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "oid",
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  const raw = counter!.seq;
  const letterIndex = Math.floor((raw - 1) / 9999999);
  const num = ((raw - 1) % 9999999) + 1;
  const letter = String.fromCharCode(65 + (letterIndex % 26));
  return `OID-${letter}-${String(num).padStart(7, "0")}`;
}
