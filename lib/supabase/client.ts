import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Build လုပ်နေတဲ့အချိန်မှာ URL တွေမရှိရင် Error မတက်အောင် ကာကွယ်ထားခြင်း
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}