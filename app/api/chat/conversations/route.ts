import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Message } from "@/lib/models/Message";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/conversations
 * Returns all unique conversations for the current user.
 * Each conversation has the other party's info and the last message.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);

    await connectDB();
    const uid = new mongoose.Types.ObjectId(session.userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: uid }, { receiverId: uid }],
        },
      },
      {
        $addFields: {
          partnerId: {
            $cond: {
              if: { $eq: ["$senderId", uid] },
              then: "$receiverId",
              else: "$senderId",
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$partnerId",
          lastMessage: { $first: "$text" },
          lastMessageAt: { $first: "$createdAt" },
          lastSenderId: { $first: "$senderId" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", uid] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partner",
        },
      },
      { $unwind: "$partner" },
      {
        $project: {
          partnerId: { $toString: "$_id" },
          partnerName: {
            $ifNull: ["$partner.fullName", "$partner.email"],
          },
          partnerEmail: "$partner.email",
          partnerRole: "$partner.role",
          lastMessage: 1,
          lastMessageAt: 1,
          lastSenderId: { $toString: "$lastSenderId" },
          unreadCount: 1,
        },
      },
    ]);

    const role = request.nextUrl.searchParams.get("role");
    let filtered = conversations;
    if (role) {
      filtered = conversations.filter(
        (m: { partnerRole: string }) => m.partnerRole === role,
      );
    }

    return NextResponse.json({ conversations: filtered });
  } catch (err) {
    console.error("Chat conversations error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
