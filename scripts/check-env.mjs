/**
 * .env.local の必須環境変数を確認（値は表示しない）
 * 実行: npm run check:env
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  getSupabaseAnonKeyFromVars,
  getSupabaseProjectRefFromVars,
  getSupabaseUrlFromVars,
  isSupabaseConfiguredFromVars,
  PLACEHOLDER_KEY,
  PLACEHOLDER_REF,
  PLACEHOLDER_URL,
} from "../lib/supabase/env-resolve.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

function parseEnv(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

console.log("");
console.log("  AI Builder — 環境変数チェック");
console.log("  ファイル: .env.local");
console.log("");

if (!existsSync(envPath)) {
  console.log("  ❌ .env.local が見つかりません");
  console.log("     .env.example をコピーして作成してください:");
  console.log("     copy .env.example .env.local");
  process.exit(1);
}

const vars = parseEnv(readFileSync(envPath, "utf8"));
const ref = getSupabaseProjectRefFromVars(vars);
const url = getSupabaseUrlFromVars(vars);
const key = getSupabaseAnonKeyFromVars(vars);
const ok = isSupabaseConfiguredFromVars(vars);

const rawRef = vars.NEXT_PUBLIC_SUPABASE_PROJECT_REF?.trim();
const rawUrl = vars.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawKey = vars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (ref) {
  console.log(`  ✅ NEXT_PUBLIC_SUPABASE_PROJECT_REF — 設定済み (${ref})`);
} else if (rawRef && PLACEHOLDER_REF.test(rawRef)) {
  console.log("  ⚠️  NEXT_PUBLIC_SUPABASE_PROJECT_REF — 仮の値のままです");
} else {
  console.log("  ❌ NEXT_PUBLIC_SUPABASE_PROJECT_REF — 未設定");
  console.log("     Supabase → Settings → General → Reference ID");
}

if (url && !PLACEHOLDER_URL.test(url)) {
  console.log(`  ✅ Project URL — 自動生成済み (${url})`);
} else if (rawUrl && PLACEHOLDER_URL.test(rawUrl)) {
  console.log("  ⚠️  NEXT_PUBLIC_SUPABASE_URL — 仮の値（Reference ID から自動生成されます）");
} else {
  console.log("  ❌ Project URL — Reference ID が必要です");
}

if (key) {
  console.log("  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY — 設定済み");
} else if (rawKey && PLACEHOLDER_KEY.test(rawKey)) {
  console.log("  ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY — 仮の値のままです");
} else {
  console.log("  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY — 未設定");
}

if (vars.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("  ℹ️  SUPABASE_SERVICE_ROLE_KEY — 設定されていますが、このアプリでは不要です");
}

if (vars.NEXT_PUBLIC_APP_URL) {
  console.log("  ✅ NEXT_PUBLIC_APP_URL — 設定済み");
} else {
  console.log("  ℹ️  NEXT_PUBLIC_APP_URL — 未設定（ローカルでは http://localhost:3000 が使われます）");
}

const openaiKey = vars.OPENAI_API_KEY?.trim();
if (openaiKey && !/your-openai|xxxx|placeholder/i.test(openaiKey)) {
  console.log("  ✅ OPENAI_API_KEY — 設定済み（GPT-4o プロンプト生成が有効）");
} else {
  console.log("  ⚠️  OPENAI_API_KEY — 未設定（プロンプト生成はテンプレートにフォールバック）");
}

if (vars.AI_MODEL) {
  console.log(`  ℹ️  AI_MODEL — ${vars.AI_MODEL}`);
}

console.log("");
if (ok) {
  console.log("  すべて OK です。npm run dev で起動してログインを試してください。");
} else {
  console.log("  設定方法:");
  console.log("    1. Publishable key を .env.local に貼り付け");
  console.log("    2. npm run setup:env -- <Reference ID>");
  console.log("  詳細: docs/setup-env.md");
}
console.log("");

process.exit(ok ? 0 : 1);
