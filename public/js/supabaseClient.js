/**
 * AI Builder v2.0 — Supabase ブラウザクライアント
 */

import { createBrowserClient } from "https://esm.sh/@supabase/ssr@0.5.2";

/** 端末に保存するメールアドレス（次回自動ログイン用） */
export const SAVED_EMAIL_KEY = "ai_builder_saved_email";

let client = null;
let config = null;

/** @returns {Promise<{supabaseUrl:string,supabaseAnonKey:string}|null>} */
export async function getAppConfig() {
  if (config) return config;
  try {
    const res = await fetch("/api/config");
    if (!res.ok) return null;
    config = await res.json();
    return config;
  } catch {
    return null;
  }
}

/** @returns {Promise<import("@supabase/supabase-js").SupabaseClient|null>} */
export async function getSupabase() {
  if (client) return client;
  const cfg = await getAppConfig();
  if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) return null;
  client = createBrowserClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  return client;
}

/** @returns {Promise<boolean>} */
export async function isCloudEnabled() {
  const cfg = await getAppConfig();
  return Boolean(cfg?.supabaseUrl && cfg?.supabaseAnonKey);
}

/** @returns {Promise<import("@supabase/supabase-js").User|null>} */
export async function getCurrentUser() {
  const sb = await getSupabase();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

/** @returns {Promise<{role:string,full_name:string|null,email:string}|null>} */
export async function getProfile() {
  const sb = await getSupabase();
  const user = await getCurrentUser();
  if (!sb || !user) return null;
  const { data } = await sb.from("profiles").select("role, full_name, email").eq("id", user.id).single();
  return data;
}

export async function signOut() {
  const sb = await getSupabase();
  if (sb) await sb.auth.signOut();
  localStorage.removeItem(SAVED_EMAIL_KEY);
  localStorage.removeItem("ai_builder_device_auth");
  window.location.href = "/login";
}
