"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileSignOut() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg bg-slate-700/60 px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-600 transition hover:bg-slate-700 hover:text-slate-100"
    >
      Sign out
    </button>
  );
}
