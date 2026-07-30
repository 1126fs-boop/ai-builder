/**
 * Supabase 環境変数の解決（Node スクリプト / next.config 共通）
 * 新UI: Project URL の代わりに Reference ID から URL を自動生成
 */

export const PLACEHOLDER_URL = /your-project|xxxx|example|placeholder/i;
export const PLACEHOLDER_KEY = /your-anon|your-publishable|xxxx|example|placeholder/i;
export const PLACEHOLDER_REF = /your-project-ref|your-project|xxxx|example|placeholder/i;

/** JWT 形式の anon キーから project ref を抽出 */
export function extractRefFromJwtKey(key) {
  if (!key?.startsWith("eyJ")) return null;
  try {
    const payload = key.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return json.ref ?? null;
  } catch {
    return null;
  }
}

/** ダッシュボード URL から project ref を抽出 */
export function extractRefFromDashboardUrl(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  const fromUrl = trimmed.match(/\/project\/([a-z0-9]+)/i);
  if (fromUrl) return fromUrl[1];
  if (/^[a-z0-9]{10,30}$/i.test(trimmed)) return trimmed;
  return null;
}

/** 環境変数オブジェクトから Publishable / anon キーを取得 */
export function getSupabaseAnonKeyFromVars(vars = process.env) {
  for (const raw of [
    vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    vars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ]) {
    const key = raw?.trim();
    if (!key || PLACEHOLDER_KEY.test(key)) continue;
    if (key.startsWith("sb_publishable_") || key.startsWith("eyJ")) return key;
  }
  return null;
}

/** 環境変数オブジェクトから Project Reference ID を取得 */
export function getSupabaseProjectRefFromVars(vars = process.env) {
  const ref = vars.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
  if (ref && !PLACEHOLDER_REF.test(ref)) return ref;

  const url = vars.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (url && !PLACEHOLDER_URL.test(url)) {
    const match = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (match?.[1]) return match[1];
  }

  const key = getSupabaseAnonKeyFromVars(vars);
  if (key) {
    const fromJwt = extractRefFromJwtKey(key);
    if (fromJwt) return fromJwt;
  }

  return null;
}

/** Reference ID から Project URL を生成 */
export function getSupabaseUrlFromVars(vars = process.env) {
  const explicit = vars.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (explicit && !PLACEHOLDER_URL.test(explicit)) return explicit;

  const ref = getSupabaseProjectRefFromVars(vars);
  return ref ? `https://${ref}.supabase.co` : null;
}

export function isSupabaseConfiguredFromVars(vars = process.env) {
  return Boolean(getSupabaseUrlFromVars(vars) && getSupabaseAnonKeyFromVars(vars));
}

/** Supabase Management API で Publishable key から Project ref を検索 */
export async function discoverProjectRefFromAccessToken(accessToken, publishableKey) {
  if (!accessToken?.trim() || !publishableKey?.trim()) return null;

  const res = await fetch("https://api.supabase.com/v1/projects", {
    headers: { Authorization: `Bearer ${accessToken.trim()}` },
  });

  if (!res.ok) return null;

  const projects = await res.json();
  if (!Array.isArray(projects)) return null;

  for (const project of projects) {
    const ref = project.ref ?? project.id;
    if (!ref) continue;

    const keysRes = await fetch(
      `https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken.trim()}` },
      }
    );

    if (!keysRes.ok) continue;

    const keys = await keysRes.json();
    const list = Array.isArray(keys) ? keys : keys?.data ?? [];

    for (const item of list) {
      const value =
        item.api_key ?? item.key ?? item.publishable_key ?? item.value ?? null;
      if (value === publishableKey) return ref;
    }
  }

  return null;
}
