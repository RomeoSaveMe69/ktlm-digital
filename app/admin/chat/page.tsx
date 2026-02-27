"use client";

import { useCallback, useEffect, useState } from "react";

type ConversationItem = {
  participantAId: string;
  participantAName: string;
  participantAEmail: string;
  participantARole: string;
  participantBId: string;
  participantBName: string;
  participantBEmail: string;
  participantBRole: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
};

type MessageItem = {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  text: string;
  isRead: boolean;
  createdAt: string;
};

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePair, setActivePair] = useState<{
    a: string;
    b: string;
    label: string;
  } | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activePair) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/admin/chat?senderId=${activePair.a}&receiverId=${activePair.b}`,
      );
      const data = await res.json();
      if (res.ok) setMessages(data.messages ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoadingMessages(false);
    }
  }, [activePair]);

  // Poll conversations
  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 5000);
    return () => clearInterval(id);
  }, [fetchConversations]);

  // Poll messages
  useEffect(() => {
    if (!activePair) return;
    fetchMessages();
    const id = setInterval(fetchMessages, 3000);
    return () => clearInterval(id);
  }, [activePair, fetchMessages]);

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      buyer: "bg-blue-500/20 text-blue-400",
      seller: "bg-amber-500/20 text-amber-400",
      admin: "bg-red-500/20 text-red-400",
    };
    return (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${colors[role] ?? "bg-slate-700 text-slate-400"}`}
      >
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading chat data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Chat Monitor</h2>
        <p className="text-sm text-slate-500">
          Platform ပေါ်ရှိ Buyer-Seller Conversation အားလုံးကို
          စောင့်ကြည့်ရန် (Read-only)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversation List */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 lg:col-span-1">
          <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-medium text-slate-400">
            All Conversations ({conversations.length})
          </h3>
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Platform တွင် Chat မရှိသေးပါ
            </div>
          ) : (
            <ul className="divide-y divide-slate-700/40 max-h-[520px] overflow-y-auto">
              {conversations.map((c, i) => {
                const isActive =
                  activePair?.a === c.participantAId &&
                  activePair?.b === c.participantBId;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePair({
                          a: c.participantAId,
                          b: c.participantBId,
                          label: `${c.participantAName} & ${c.participantBName}`,
                        })
                      }
                      className={`w-full px-4 py-3 text-left text-sm transition hover:bg-slate-800/80 ${
                        isActive
                          ? "bg-slate-800/80 border-l-2 border-violet-500"
                          : ""
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {c.participantAName}
                          </span>
                          {getRoleBadge(c.participantARole)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span>↕</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {c.participantBName}
                          </span>
                          {getRoleBadge(c.participantBRole)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate max-w-[150px]">
                            {c.lastMessage}
                          </span>
                          <span className="shrink-0 rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px]">
                            {c.messageCount} msgs
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Messages Panel (Read-only) */}
        <div className="flex flex-col rounded-xl border border-slate-700/60 bg-slate-800/50 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-3">
            <h3 className="text-sm font-medium text-slate-400">
              {activePair
                ? `Messages — ${activePair.label}`
                : "Messages (read-only)"}
            </h3>
            {activePair && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-medium uppercase text-amber-400">
                Read-only Monitor
              </span>
            )}
          </div>

          {!activePair ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 p-6 text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <p>Select a conversation to view messages</p>
              <p className="text-xs text-slate-600">
                Admin can read all messages for dispute resolution
              </p>
            </div>
          ) : loadingMessages ? (
            <div className="flex min-h-[400px] items-center justify-center text-slate-500">
              Loading messages...
            </div>
          ) : (
            <div className="max-h-[480px] flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                  No messages in this conversation
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m._id} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                        {m.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {m.senderName}
                          </span>
                          {getRoleBadge(m.senderRole)}
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.createdAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-300 whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
