/** Admin User: user list with deposit balance. Dummy data only. */

const DUMMY_USERS = [
  { id: "U1", name: "User One", email: "user1@mail.com", depositBalance: "45,000" },
  { id: "U2", name: "User Two", email: "user2@mail.com", depositBalance: "120,000" },
  { id: "U3", name: "User Three", email: "user3@mail.com", depositBalance: "0" },
  { id: "U4", name: "User Four", email: "user4@mail.com", depositBalance: "28,500" },
];

export default function AdminUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">User</h2>
        <p className="text-sm text-slate-500">User စာရင်းနှင့် Deposit Balance</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-400">Name</th>
                <th className="px-4 py-3 font-medium text-slate-400">Email</th>
                <th className="px-4 py-3 font-medium text-slate-400">Deposit Balance (MMK)</th>
                <th className="px-4 py-3 font-medium text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_USERS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-200">{row.name}</td>
                  <td className="px-4 py-3 text-slate-400">{row.email}</td>
                  <td className="px-4 py-3 text-slate-200">{row.depositBalance}</td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-emerald-400 hover:text-emerald-300">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
