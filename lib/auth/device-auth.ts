/** 端末ごとの自動生成パスワード（ユーザーには見せない） */
export const DEVICE_AUTH_KEY = "ai_builder_device_auth";

type DeviceAuthMap = Record<string, string>;

function readMap(): DeviceAuthMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DEVICE_AUTH_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeMap(map: DeviceAuthMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_AUTH_KEY, JSON.stringify(map));
}

/** 端末に保存された自動パスワードを取得 */
export function getDevicePassword(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return readMap()[normalized] ?? null;
}

/** 端末に自動パスワードを保存 */
export function saveDevicePassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const map = readMap();
  map[normalized] = password;
  writeMap(map);
}

/** 端末の自動パスワードを削除（ログイン失敗時など） */
export function removeDevicePassword(email: string) {
  const normalized = email.trim().toLowerCase();
  const map = readMap();
  delete map[normalized];
  writeMap(map);
}

/** ユーザーが入力しない自動パスワードを生成 */
export function generateDevicePassword(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${crypto.randomUUID()}${crypto.randomUUID()}`;
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}
