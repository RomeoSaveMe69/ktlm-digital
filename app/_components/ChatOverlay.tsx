"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
};

type Conversation = {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type ChatTarget = {
  sellerId: string;
  sellerName: string;
};

/**
 * Global chat overlay – Messenger-style popup pinned to bottom-right.
 * Persists across pages (rendered in root layout).
 * External code can open a chat via window event "open-chat".
 */
export default function ChatOverlay() {
  const [session, setSession] = useState<{
    userId: string;
    role: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // conversation list or active chat
  const [view, setView] = useState<"list" | "chat">("list");
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

  // Fetch session on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setSession({ userId: d.user.id, role: d.user.role });
      })
      .catch(() => {});
  }, []);

  // Listen for "open-chat" custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ChatTarget>).detail;
      if (detail?.sellerId) {
        setActivePartner({
          id: detail.sellerId,
          name: detail.sellerName,
        });
        setView("chat");
        setOpen(true);
        setMinimized(false);
      }
    };
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations ?? []);
    } catch {
      /* ignore */
    }
  }, [session]);

  // Fetch messages for active partner
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

  // Polling: conversations every 3s when list is visible
  useEffect(() => {
    if (!open || minimized || view !== "list" || !session) return;
    fetchConversations();
    const id = setInterval(fetchConversations, 3000);
    return () => clearInterval(id);
  }, [open, minimized, view, session, fetchConversations]);

  // Polling: messages every 2s when chat is active
  useEffect(() => {
    if (!open || minimized || view !== "chat" || !activePartner) return;
    fetchMessages();
    const id = setInterval(fetchMessages, 2000);
    return () => clearInterval(id);
  }, [open, minimized, view, activePartner, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opening chat
  useEffect(() => {
    if (view === "chat" && open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [view, open, minimized]);

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

  const openChat = (partner: { id: string; name: string }) => {
    setActivePartner(partner);
    setView("chat");
  };

  const totalUnread = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0,
  );

  // Don't render for admin or when not logged in
  if (!session || session.role === "admin") return null;

  // Minimized state — small floating bubble
  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => {
          setMinimized(false);
          setOpen(true);
        }}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {totalUnread}
          </span>
        )}
      </button>
    );
  }

  // Closed — floating chat bubble
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setView("list");
        }}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {totalUnread}
          </span>
        )}
      </button>
    );
  }

  // Open chat overlay
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/80 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3">
        <div className="flex items-center gap-2">
          {view === "chat" && (
            <button
              type="button"
              onClick={() => {
                setView("list");
                setActivePartner(null);
              }}
              className="mr-1 text-white/70 transition hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <h3 className="text-sm font-semibold text-white">
            {view === "chat" && activePartner
              ? activePartner.name
              : "Messages"}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="rounded p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
            title="Minimize"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 12H6"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setView("list");
              setActivePartner(null);
            }}
            className="rounded p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "list" ? (
        <div className="max-h-[400px] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
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
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-slate-600">
                Start by chatting with a seller on a product page
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {conversations.map((c) => (
                <li key={c.partnerId}>
                  <button
                    type="button"
                    onClick={() =>
                      openChat({ id: c.partnerId, name: c.partnerName })
                    }
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-800/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                      {c.partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {c.partnerName}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {c.lastMessage}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex max-h-[340px] flex-1 flex-col gap-1.5 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="flex flex-1 items-center justify-center py-10 text-sm text-slate-500">
                Start the conversation...
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
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      isMe
                        ? "rounded-br-md bg-emerald-600 text-white"
                        : "rounded-bl-md bg-slate-800 text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p
                      className={`mt-0.5 text-[10px] ${
                        isMe ? "text-emerald-200/60" : "text-slate-500"
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
          <div className="border-t border-slate-700/80 p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-40"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
