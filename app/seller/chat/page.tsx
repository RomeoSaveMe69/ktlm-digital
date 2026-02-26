/** Seller Chat: chat with buyers. UI shell only. */

const DUMMY_CHATS = [
  { id: "CH1", orderId: "ORD-X1", buyer: "user1@mail.com" },
  { id: "CH2", orderId: "ORD-X2", buyer: "user2@mail.com" },
];

export default function SellerChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Chat</h2>
        <p className="text-sm text-slate-500">Buyer နှင့် စကားပြောရန် Chat</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 lg:col-span-1">
          <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-medium text-slate-400">
            Conversations
          </h3>
          <ul className="divide-y divide-slate-700/40">
            {DUMMY_CHATS.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-800/80"
                >
                  <span className="font-mono text-slate-500">{c.orderId}</span>
                  <span className="mt-1 block text-slate-300">{c.buyer}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 lg:col-span-2">
          <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-medium text-slate-400">
            Messages
          </h3>
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 p-6 text-slate-500">
            <p>Select a conversation to view and send messages.</p>
            <p className="text-xs">Chat interface will connect when backend is ready.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
