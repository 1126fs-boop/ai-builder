import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/** ビルド時プリレンダー用（未設定時のみ・通信は行われない） */
const BUILD_STUB_URL = "https://placeholder.supabase.co";
const BUILD_STUB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIn0.placeholder";

export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    if (typeof window === "undefined") {
      return createBrowserClient(BUILD_STUB_URL, BUILD_STUB_KEY);
    }
    throw new Error("Supabase が未設定です。npm run setup:env を実行してください。");
  }

  return createBrowserClient(url, key);
}
