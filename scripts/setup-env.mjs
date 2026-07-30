/**
 * .env.local を自動生成・更新
 *
 * 使い方:
 *   npm run setup:env
 *   npm run setup:env -- <Project Reference ID>
 *   npm run setup:env -- https://supabase.com/dashboard/project/abcdefgh/...
 *
 * Supabase 新UIで必要なもの:
 *   - Settings → General → Reference ID
 *   - Connect → API Keys → Publishable key（sb_publishable_...）
 *
 * 任意: SUPABASE_ACCESS_TOKEN（Account → Access Tokens）を .env.local に置くと
 *       Reference ID を自動検出できます
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  discoverProjectRefFromAccessToken,
  extractRefFromDashboardUrl,
  extractRefFromJwtKey,
} from "../lib/supabase/env-resolve.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");
const examplePath = join(root, ".env.example");

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

function buildEnvContent({ projectRef, publishableKey, appUrl }) {
  const url = `https://${projectRef}.supabase.co`;
  return `# 自動生成 — npm run setup:env
# Supabase 新UI: Project URL の代わりに Reference ID を使用（URL は自動生成）

NEXT_PUBLIC_SUPABASE_PROJECT_REF=${projectRef}
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${publishableKey}
NEXT_PUBLIC_APP_URL=${appUrl}
`;
}

const argRef = extractRefFromDashboardUrl(process.argv[2]);

let existing = {};
if (existsSync(envPath)) {
  existing = parseEnv(readFileSync(envPath, "utf8"));
} else if (existsSync(examplePath)) {
  existing = parseEnv(readFileSync(examplePath, "utf8"));
}

const publishableKey =
  existing.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  existing.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

let projectRef =
  argRef ||
  extractRefFromDashboardUrl(existing.NEXT_PUBLIC_SUPABASE_PROJECT_REF) ||
  extractRefFromJwtKey(publishableKey) ||
  (existing.NEXT_PUBLIC_SUPABASE_URL &&
  !existing.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")
    ? existing.NEXT_PUBLIC_SUPABASE_URL.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1]
    : null);

console.log("");
console.log("  AI Builder — .env.local 自動設定");
console.log("");

if (!publishableKey || publishableKey.includes("your-anon")) {
  console.log("  ❌ Publishable key が見つかりません。");
  console.log("");
  console.log("  Supabase → Connect → API Keys");
  console.log("  「Publishable key」（sb_publishable_...）を");
  console.log("  .env.local の NEXT_PUBLIC_SUPABASE_ANON_KEY に貼り付けてから再実行してください。");
  console.log("");
  process.exit(1);
}

if (!projectRef && existing.SUPABASE_ACCESS_TOKEN) {
  console.log("  🔍 Access Token から Reference ID を検索中...");
  projectRef = await discoverProjectRefFromAccessToken(
    existing.SUPABASE_ACCESS_TOKEN,
    publishableKey
  );
  if (projectRef) {
    console.log(`  ✅ Reference ID を自動検出: ${projectRef}`);
  }
}

if (!projectRef) {
  console.log("  ⚠️  Project Reference ID が必要です。");
  console.log("");
  console.log("  確認場所（Supabase 新UI）:");
  console.log("    Settings → General → Reference ID");
  console.log("  またはブラウザの URL:");
  console.log("    .../project/【Reference ID】/...");
  console.log("");
  console.log("  実行例:");
  console.log("    npm run setup:env -- abcdefghijklmnop");
  console.log("    npm run setup:env -- https://supabase.com/dashboard/project/abcdefghijklmnop");
  console.log("");
  console.log("  ヒント: Account → Access Tokens でトークンを作成し、");
  console.log("  .env.local に SUPABASE_ACCESS_TOKEN=... を追加すると自動検出できます。");
  console.log("");
  process.exit(1);
}

const appUrl = existing.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
writeFileSync(envPath, buildEnvContent({ projectRef, publishableKey, appUrl }), "utf8");

console.log("  ✅ .env.local を生成しました");
console.log(`  Reference ID : ${projectRef}`);
console.log(`  Project URL  : https://${projectRef}.supabase.co （自動生成）`);
console.log(`  Publishable  : ${publishableKey.slice(0, 24)}...`);
console.log("  次: npm run dev を再起動してください。");
console.log("");
