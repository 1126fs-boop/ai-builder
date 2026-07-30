import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, getSupabaseRedirectUrls, getSupabaseSiteUrl } from "@/lib/supabase/app-url";
import { checkSupabaseEnv, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

function resolveAppUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !/your-app|example|placeholder|xxxx/i.test(configured)) {
    return configured.replace(/\/$/, "");
  }
  const origin = request.nextUrl.origin;
  if (origin && !origin.includes("localhost")) {
    return origin;
  }
  return getAppUrl();
}

export async function GET(request: NextRequest) {
  const result = checkSupabaseEnv();
  const appUrl = resolveAppUrl(request);
  const siteUrl = getSupabaseSiteUrl(appUrl);
  const redirectUrls = getSupabaseRedirectUrls(appUrl);

  return NextResponse.json({
    ok: result.ok,
    missing: result.missing,
    placeholders: result.placeholders,
    projectRef: result.projectRef,
    resolvedUrl: result.resolvedUrl,
    appUrl,
    env: {
      hasUrl: Boolean(getSupabaseUrl()),
      hasAnonKey: Boolean(getSupabaseAnonKey()),
      hasAppUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    },
    supabaseAuth: {
      siteUrl,
      redirectUrls,
    },
    hint: result.ok
      ? "環境変数は正しく設定されています。Supabase → Authentication → URL Configuration に siteUrl と redirectUrls を登録してください。"
      : "Vercel の Environment Variables に NEXT_PUBLIC_SUPABASE_URL（または PROJECT_REF）、NEXT_PUBLIC_SUPABASE_ANON_KEY、NEXT_PUBLIC_APP_URL を設定して Redeploy してください。",
  });
}
