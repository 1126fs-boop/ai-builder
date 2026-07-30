/**
 * AI Builder v2.0 — ユーザーバー（ログアウト・管理リンク）
 */

import { getCurrentUser, getProfile, signOut, isCloudEnabled } from "./supabaseClient.js";

export async function initAuthBar() {
  const bar = document.getElementById("app-bar");
  const userEl = document.getElementById("app-bar-user");
  const adminLink = document.getElementById("app-bar-admin");
  const logoutBtn = document.getElementById("btn-logout");

  if (!bar) return;

  const cloud = await isCloudEnabled();
  if (!cloud) {
    bar.hidden = true;
    return;
  }

  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "/login";
    return;
  }

  const profile = await getProfile();
  const displayName = profile?.full_name || user.email?.split("@")[0] || "ユーザー";
  userEl.textContent = `${displayName} さん`;

  if (profile?.role === "admin" && adminLink) {
    adminLink.hidden = false;
  }

  logoutBtn?.addEventListener("click", () => signOut());
}
