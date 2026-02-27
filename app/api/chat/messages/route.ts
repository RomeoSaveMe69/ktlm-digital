import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Message } from "@/lib/models/Message";
import { apiError, normalizeErrorMessage } from "@/lib/api-utils";
import "@/lib/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/messages?partnerId=xxx
 * Returns all messages between current user and the partner, sorted by time.
 * Also marks received messages as read.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);

    const partnerId = request.nextUrl.searchParams.get("partnerId");
    if (!partnerId) return apiError("partnerId is required", 400);

    await connectDB();
    const userId = session.userId;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages as read
    await Message.updateMany(
      { senderId: partnerId, receiverId: userId, isRead: false },
      { $set: { isRead: true } },
    );

    const formatted = messages.map((m) => ({
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      text: m.text,
      isRead: m.isRead,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ messages: formatted });
  } catch (err) {
    console.error("Chat messages GET error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}

/**
 * POST /api/chat/messages
 * Send a new message. Body: { receiverId: string, text: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return apiError("Unauthorized", 401);

    await connectDB();
    const { receiverId, text } = await request.json();

    if (!receiverId || !text?.trim()) {
      return apiError("receiverId and text are required", 400);
    }

    if (receiverId === session.userId) {
      return apiError("Cannot message yourself", 400);
    }

    const message = await Message.create({
      senderId: new mongoose.Types.ObjectId(session.userId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      text: text.trim(),
    });

    return NextResponse.json({
      message: {
        _id: message._id.toString(),
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        text: message.text,
        isRead: message.isRead,
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    console.error("Chat messages POST error:", err);
    return apiError(normalizeErrorMessage(err), 500);
  }
}
