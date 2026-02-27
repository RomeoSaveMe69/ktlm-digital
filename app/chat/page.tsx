"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Conversation = {
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageAt: string;
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

export default function BuyerChatPage() {
  const [session, setSession] = useState<{ userId: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d.user) setSession({ userId: d.user.id }); })
      .catch(() => {});
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activePartner) return;
    try {
      const res = await fetch(`/api/chat/messages?partnerId=${activePartner.id}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages ?? []);
    } catch { /* ignore */ }
  }, [activePartner]);

  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 3000);
    return () => clearInterval(id);
  }, [fetchConversations]);

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
    if (activePartner) setTimeout(() => inputRef.current?.focus(), 100);
  }, [activePartner]);

  const handleSend = async () => {
    if (!text.trim() || !activePartner || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activePartner.id, text: text.trim() }),
      });
      if (res.ok) { setText(""); await fetchMessages(); }
    } catch { /* ignore */ } finally { setSending(false); }
  };

  const selectPartner = (partner: { id: string; name: string }) => {
    setActivePartner(partner);
    setMobileShowChat(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
          <h1 className="text-lg font-bold text-slate-100">Messages</h1>
          {mobileShowChat && activePartner && (
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              className="ml-auto text-sm text-slate-400 hover:text-slate-200 lg:hidden"
            >
              ← Conversations
            </button>
          )}
        </div>
      </header>

      <div className="flex" style={{ height: "calc(100vh - 57px)" }}>
        {/* Sidebar */}
        <div className={`w-full border-r border-slate-800 bg-slate-900/50 lg:block lg:w-80 ${mobileShowChat ? "hidden" : "block"}`}>
          <div className="border-b border-slate-800/60 px-4 py-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Conversations</p>
          </div>
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No conversations yet. Start chatting with a seller from a product page.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/50 overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
              {conversations.map((c) => (
                <li key={c.partnerId}>
                  <button
                    type="button"
                    onClick={() => selectPartner({ id: c.partnerId, name: c.partnerName })}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800/60 ${
                      activePartner?.id === c.partnerId ? "bg-slate-800/80 border-l-2 border-emerald-500" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                      {c.partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-slate-200">{c.partnerName}</p>
                        {c.unreadCount > 0 && (
                          <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">{c.lastMessage}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat Panel */}
        <div className={`flex flex-1 flex-col ${mobileShowChat ? "block" : "hidden lg:flex"}`}>
          {!activePartner ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-800/60 px-4 py-3 bg-slate-900/30">
                <p className="text-sm font-medium text-slate-200">{activePartner.name}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && (
                  <div className="flex flex-1 items-center justify-center py-10 text-sm text-slate-500">
                    Start the conversation...
                  </div>
                )}
                {messages.map((m) => {
                  const isMe = m.senderId === session?.userId;
                  return (
                    <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        isMe ? "rounded-br-md bg-emerald-600 text-white" : "rounded-bl-md bg-slate-800 text-slate-200"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p className={`mt-0.5 text-[10px] ${isMe ? "text-emerald-200/60" : "text-slate-500"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-800/80 p-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
