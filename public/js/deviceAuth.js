/**
 * 端末ごとの自動パスワード管理（静的アプリ用）
 * ユーザーには見せず、メールアドレスのみのログインを実現する
 */

export const DEVICE_AUTH_KEY = "ai_builder_device_auth";
export const SAVED_EMAIL_KEY = "ai_builder_saved_email";

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(DEVICE_AUTH_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeMap(map) {
  localStorage.setItem(DEVICE_AUTH_KEY, JSON.stringify(map));
}

export function getDevicePassword(email) {
  const normalized = email.trim().toLowerCase();
  return readMap()[normalized] ?? null;
}

export function saveDevicePassword(email, password) {
  const normalized = email.trim().toLowerCase();
  const map = readMap();
  map[normalized] = password;
  writeMap(map);
}

function generateDevicePassword() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${crypto.randomUUID()}${crypto.randomUUID()}`;
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/** メールリンク経由でログインした後、この端末用パスワードを登録 */
export async function ensureDeviceCredentials(getSupabase, getCurrentUser) {
  const user = await getCurrentUser();
  if (!user?.email) return;

  const email = user.email.trim().toLowerCase();
  localStorage.setItem(SAVED_EMAIL_KEY, email);

  if (getDevicePassword(email)) return;

  const sb = await getSupabase();
  if (!sb) return;

  const password = generateDevicePassword();
  const { error } = await sb.auth.updateUser({ password });
  if (!error) {
    saveDevicePassword(email, password);
  }
}
