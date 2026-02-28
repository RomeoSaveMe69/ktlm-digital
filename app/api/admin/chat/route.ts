import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Message } from "@/lib/models/Message";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chat
 * Admin: list all unique conversations on the platform.
 * Optional: ?senderId=x&receiverId=y to get messages for a specific pair.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectDB();

    const senderId = request.nextUrl.searchParams.get("senderId");
    const receiverId = request.nextUrl.searchParams.get("receiverId");

    // If both IDs provided, return messages for that conversation
    if (senderId && receiverId) {
      const messages = await Message.find({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      })
        .sort({ createdAt: 1 })
        .populate("senderId", "fullName email role shopName")
        .populate("receiverId", "fullName email role shopName")
        .lean();

      type PopulatedUser = { _id: { toString(): string }; shopName?: string; fullName?: string; email?: string; role?: string };
      const formatted = messages.map((m) => ({
        _id: m._id.toString(),
        senderId: (m.senderId as PopulatedUser)._id.toString(),
        senderName:
          (m.senderId as PopulatedUser)?.shopName ||
          (m.senderId as PopulatedUser)?.fullName ||
          (m.senderId as PopulatedUser)?.email ||
          "Unknown",
        senderRole: (m.senderId as PopulatedUser)?.role ?? "",
        receiverId: (m.receiverId as PopulatedUser)._id.toString(),
        receiverName:
          (m.receiverId as PopulatedUser)?.shopName ||
          (m.receiverId as PopulatedUser)?.fullName ||
          (m.receiverId as PopulatedUser)?.email ||
          "Unknown",
        text: m.text,
        isRead: m.isRead,
        createdAt: m.createdAt,
      }));

      return NextResponse.json({ messages: formatted });
    }

    // Otherwise, list all conversations grouped by participant pairs
    const conversations = await Message.aggregate([
      {
        $addFields: {
          sortedPair: {
            $cond: {
              if: { $lt: ["$senderId", "$receiverId"] },
              then: { a: "$senderId", b: "$receiverId" },
              else: { a: "$receiverId", b: "$senderId" },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { a: "$sortedPair.a", b: "$sortedPair.b" },
          lastMessage: { $first: "$text" },
          lastMessageAt: { $first: "$createdAt" },
          messageCount: { $sum: 1 },
          participantA: { $first: "$sortedPair.a" },
          participantB: { $first: "$sortedPair.b" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "participantA",
          foreignField: "_id",
          as: "userA",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "participantB",
          foreignField: "_id",
          as: "userB",
        },
      },
      { $unwind: { path: "$userA", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$userB", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          participantAId: { $toString: "$participantA" },
          participantAName: {
            $ifNull: ["$userA.shopName", "$userA.fullName", "$userA.email"],
          },
          participantAEmail: "$userA.email",
          participantARole: "$userA.role",
          participantBId: { $toString: "$participantB" },
          participantBName: {
            $ifNull: ["$userB.shopName", "$userB.fullName", "$userB.email"],
          },
          participantBEmail: "$userB.email",
          participantBRole: "$userB.role",
          lastMessage: 1,
          lastMessageAt: 1,
          messageCount: 1,
        },
      },
    ]);

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Admin chat error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
