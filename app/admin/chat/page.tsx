/** Admin Chat: monitor buyer–seller chats. UI shell only. */

const DUMMY_ROOMS = [
  { id: "C1", orderId: "ORD-A1B2C3", buyer: "user1@mail.com", seller: "seller1@mail.com" },
  { id: "C2", orderId: "ORD-D4E5F6", buyer: "user2@mail.com", seller: "seller2@mail.com" },
];

export default function AdminChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Chat</h2>
        <p className="text-sm text-slate-500">Buyer နှင့် Seller ပြောထားသော Chat များကို စောင့်ကြည့်ရန် (Monitor view)</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 lg:col-span-1">
          <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-medium text-slate-400">
            Chat Rooms
          </h3>
          <ul className="divide-y divide-slate-700/40">
            {DUMMY_ROOMS.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-800/80"
                >
                  <span className="font-mono text-slate-500">{r.orderId}</span>
                  <span className="mt-1 block text-slate-300">{r.buyer} ↔ {r.seller}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 lg:col-span-2">
          <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-medium text-slate-400">
            Messages (read-only)
          </h3>
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 p-6 text-slate-500">
            <p>Select a chat room to view messages.</p>
            <p className="text-xs">Admin can read all messages for dispute resolution.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
