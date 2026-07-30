/**
 * Supabase 環境変数の解決（新UI: Project URL 不要 → Reference ID から自動生成）
 */

const PLACEHOLDER_URL = /your-project|xxxx|example|placeholder/i;
const PLACEHOLDER_KEY = /your-anon|your-publishable|xxxx|example|placeholder/i;
const PLACEHOLDER_REF = /your-project-ref|your-project|xxxx|example|placeholder/i;

/** JWT 形式の anon キーから project ref を抽出（legacy キー用） */
function extractRefFromJwtKey(key: string): string | null {
  if (!key.startsWith("eyJ")) return null;
  try {
    const payload = key.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof json.ref === "string" ? json.ref : null;
  } catch {
    return null;
  }
}

/** ダッシュボード URL から project ref を抽出 */
export function extractRefFromDashboardUrl(input: string): string | null {
  const match = input.match(/\/project\/([a-z0-9]+)/i);
  return match?.[1] ?? null;
}

/** Project Reference ID（Settings → General） */
export function getSupabaseProjectRef(): string | null {
  const ref = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
  if (ref && !PLACEHOLDER_REF.test(ref)) return ref;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (url && !PLACEHOLDER_URL.test(url)) {
    const match = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (match?.[1]) return match[1];
  }

  const key = getSupabaseAnonKey();
  if (key) {
    const fromJwt = extractRefFromJwtKey(key);
    if (fromJwt) return fromJwt;
  }

  return null;
}

/** Publishable key（sb_publishable_...）または legacy anon key（eyJ...） */
export function getSupabaseAnonKey(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ];

  for (const raw of candidates) {
    const key = raw?.trim();
    if (!key || PLACEHOLDER_KEY.test(key)) continue;
    if (key.startsWith("sb_publishable_") || key.startsWith("eyJ")) return key;
  }

  return null;
}

/** Project URL — 明示設定 or Reference ID から `https://{ref}.supabase.co` を生成 */
export function getSupabaseUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (explicit && !PLACEHOLDER_URL.test(explicit)) return explicit;

  const ref = getSupabaseProjectRef();
  if (ref) return `https://${ref}.supabase.co`;

  return null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export type SupabaseEnvCheck = {
  ok: boolean;
  missing: string[];
  placeholders: string[];
  resolvedUrl: string | null;
  hasKey: boolean;
  projectRef: string | null;
};

/** 設定状態の確認（秘密の値は返さない） */
export function checkSupabaseEnv(): SupabaseEnvCheck {
  const missing: string[] = [];
  const placeholders: string[] = [];

  const rawRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const hasResolvableRef = Boolean(getSupabaseProjectRef());
  const hasExplicitUrl = Boolean(rawUrl && !PLACEHOLDER_URL.test(rawUrl));

  if (!hasResolvableRef && !hasExplicitUrl) {
    if (!rawRef && !rawUrl) {
      missing.push("NEXT_PUBLIC_SUPABASE_PROJECT_REF");
    } else if (rawRef && PLACEHOLDER_REF.test(rawRef)) {
      placeholders.push("NEXT_PUBLIC_SUPABASE_PROJECT_REF");
    } else if (rawUrl && PLACEHOLDER_URL.test(rawUrl)) {
      placeholders.push("NEXT_PUBLIC_SUPABASE_URL");
    }
  }

  const key = getSupabaseAnonKey();
  if (!rawKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  } else if (!key) {
    placeholders.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    ok: missing.length === 0 && placeholders.length === 0 && isSupabaseConfigured(),
    missing,
    placeholders,
    resolvedUrl: getSupabaseUrl(),
    hasKey: Boolean(key),
    projectRef: getSupabaseProjectRef(),
  };
}
