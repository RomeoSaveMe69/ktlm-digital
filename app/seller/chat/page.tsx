"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Conversation = {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: string;
  unreadCount: number;
};

type Message = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
};

export default function SellerChatPage() {
  const [session, setSession] = useState<{ userId: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setSession({ userId: d.user.id });
      })
      .catch(() => {});
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations?role=buyer");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activePartner) return;
    try {
      const res = await fetch(
        `/api/chat/messages?partnerId=${activePartner.id}`,
      );
      const data = await res.json();
      if (res.ok) setMessages(data.messages ?? []);
    } catch {
      /* ignore */
    }
  }, [activePartner]);

  // Poll conversations
  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 3000);
    return () => clearInterval(id);
  }, [fetchConversations]);

  // Poll messages
  useEffect(() => {
    if (!activePartner) return;
    fetchMessages();
    const id = setInterval(fetchMessages, 2000);
    return () => clearInterval(id);
  }, [activePartner, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activePartner) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activePartner]);

  const handleSend = async () => {
    if (!text.trim() || !activePartner || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activePartner.id,
          text: text.trim(),
        }),
      });
      if (res.ok) {
        setText("");
        await fetchMessages();
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Chat</h2>
        <p className="text-sm text-slate-500">
          Buyer များနှင့် စကားပြောရန်
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversation List */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 lg:col-span-1">
          <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-medium text-slate-400">
            Conversations
          </h3>
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Buyer စကားပြောမှု မရှိသေးပါ
            </div>
          ) : (
            <ul className="divide-y divide-slate-700/40 max-h-[500px] overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.partnerId}>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePartner({
                        id: c.partnerId,
                        name: c.partnerName,
                      })
                    }
                    className={`w-full px-4 py-3 text-left text-sm transition hover:bg-slate-800/80 ${
                      activePartner?.id === c.partnerId
                        ? "bg-slate-800/80 border-l-2 border-emerald-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                          {c.partnerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-200">
                            {c.partnerName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {c.lastMessage}
                          </p>
                        </div>
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Messages Panel */}
        <div className="flex flex-col rounded-xl border border-slate-700/60 bg-slate-800/50 lg:col-span-2">
          <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-medium text-slate-400">
            {activePartner
              ? `Chat with ${activePartner.name}`
              : "Messages"}
          </h3>

          {!activePartner ? (
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex max-h-[400px] flex-1 flex-col gap-2 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="flex flex-1 items-center justify-center py-10 text-sm text-slate-500">
                    No messages yet
                  </div>
                )}
                {messages.map((m) => {
                  const isMe = m.senderId === session?.userId;
                  return (
                    <div
                      key={m._id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "rounded-br-md bg-emerald-600 text-white"
                            : "rounded-bl-md bg-slate-700/80 text-slate-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                        <p
                          className={`mt-0.5 text-[10px] ${
                            isMe
                              ? "text-emerald-200/60"
                              : "text-slate-500"
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-700/80 p-4">
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
