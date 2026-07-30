const PLACEHOLDER_APP_URL = /your-app|example|placeholder|xxxx/i;

/** 本番・ローカルのアプリ URL（NEXT_PUBLIC_APP_URL 優先、なければブラウザ origin） */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !PLACEHOLDER_APP_URL.test(configured)) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

/** Supabase Authentication に登録する Redirect URL 一覧 */
export function getSupabaseRedirectUrls(appUrl = getAppUrl()): string[] {
  const base = appUrl.replace(/\/$/, "");
  return [
    `${base}/auth/callback`,
    `${base}/login`,
    "http://localhost:3000/auth/callback",
    "http://localhost:3000/login",
  ];
}

/** Supabase Authentication の Site URL 推奨値 */
export function getSupabaseSiteUrl(appUrl = getAppUrl()): string {
  return appUrl.replace(/\/$/, "");
}

/** メール確認・OTP 用のコールバック URL */
export function getAuthCallbackUrl(next = "/index.html"): string {
  const base = getAppUrl().replace(/\/$/, "");
  const safeNext = next.startsWith("/") ? next : "/index.html";
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
