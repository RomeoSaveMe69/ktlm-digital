"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UserRow = {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  kycStatus: string;
};

const ROLES = ["buyer", "seller", "admin"] as const;

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRoleChange = async (id: string, newRole: string) => {
    if (!ROLES.includes(newRole as (typeof ROLES)[number])) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } catch {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700/80 bg-slate-800/80">
            <th className="px-4 py-3 font-medium text-slate-400">Email</th>
            <th className="px-4 py-3 font-medium text-slate-400">Name</th>
            <th className="px-4 py-3 font-medium text-slate-400">Role</th>
            <th className="px-4 py-3 font-medium text-slate-400">KYC</th>
            <th className="px-4 py-3 font-medium text-slate-400">
              Change role
            </th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                No users.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
              >
                <td className="px-4 py-3 font-medium text-slate-200">
                  {u.email}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {u.fullName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-md bg-slate-600/50 px-2 py-0.5 text-xs font-medium text-slate-300 capitalize">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs capitalize">
                  {u.kycStatus}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={loadingId === u.id}
                    className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
