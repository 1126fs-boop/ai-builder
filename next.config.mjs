import {
  getSupabaseAnonKeyFromVars,
  getSupabaseProjectRefFromVars,
  getSupabaseUrlFromVars,
} from "./lib/supabase/env-resolve.mjs";

// Reference ID から Project URL を自動生成（Supabase 新UI対応）
const ref = getSupabaseProjectRefFromVars();
const url = getSupabaseUrlFromVars();
const key = getSupabaseAnonKeyFromVars();

if (ref && url) process.env.NEXT_PUBLIC_SUPABASE_URL = url;
if (ref) process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF = ref;
if (key) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: url ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PROJECT_REF: ref ?? process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
