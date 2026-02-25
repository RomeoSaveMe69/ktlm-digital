import { redirect } from "next/navigation";

/**
 * Server-side guard: only users with role 'admin' in profiles table may proceed.
 * Call this at the top of admin layout or pages.
 *
 * When Supabase is configured:
 * 1. Get session via createServerClient().auth.getSession()
 * 2. If !session → redirect('/login')
 * 3. Fetch profile from public.profiles where id = session.user.id
 * 4. If profile.role !== 'admin' → redirect('/') or redirect('/403')
 */
export async function requireAdmin(): Promise<void> {
  // TODO: Replace with Supabase auth + profile check when configured
  // const supabase = createServerClient(...);
  // const { data: { session } } = await supabase.auth.getSession();
  // if (!session) redirect('/login');
  // const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  // if (profile?.role !== 'admin') redirect('/');
  return;
}
