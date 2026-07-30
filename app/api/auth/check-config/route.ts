import { NextResponse } from "next/server";
import { checkSupabaseEnv } from "@/lib/supabase/env";

export async function GET() {
  const result = checkSupabaseEnv();

  return NextResponse.json({
    ok: result.ok,
    missing: result.missing,
    placeholders: result.placeholders,
    projectRef: result.projectRef,
    resolvedUrl: result.resolvedUrl,
    hint: result.ok
      ? "環境変数は正しく設定されています。"
      : "npm run setup:env -- <Reference ID> を実行してください。",
  });
}
