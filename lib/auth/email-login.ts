import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth/errors";
import { SAVED_EMAIL_KEY } from "@/lib/auth/constants";
import {
  generateDevicePassword,
  getDevicePassword,
  removeDevicePassword,
  saveDevicePassword,
} from "@/lib/auth/device-auth";

import { getAuthCallbackUrl } from "@/lib/supabase/app-url";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** 端末に保存されたメールアドレスを取得 */
export function getSavedEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SAVED_EMAIL_KEY);
}

/** 端末に保存されたメールアドレスを削除（ログアウト時） */
export function clearSavedEmail(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SAVED_EMAIL_KEY);
}

/** セッション取得後、この端末用の自動パスワードが未保存なら登録する */
export async function ensureDeviceCredentials(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (getDevicePassword(normalized)) return;

  const supabase = createClient();
  const password = generateDevicePassword();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[auth/login] ensureDeviceCredentials failed:", error.message);
    return;
  }

  saveDevicePassword(normalized, password);
}

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string; pendingEmail?: boolean };

/** 登録済みメールの別端末ログイン — 確認メールを送信 */
async function sendRecoveryOtp(email: string): Promise<LoginResult> {
  const supabase = createClient();
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: getAuthCallbackUrl("/index.html"),
    },
  });

  if (otpError) {
    console.error("[auth/login] signInWithOtp error:", otpError.message, otpError);
    return { ok: false, error: mapAuthError(otpError) };
  }

  return {
    ok: false,
    pendingEmail: true,
    error:
      "別の端末で登録済みのメールアドレスです。確認メールを送信しました。メール内のリンクをクリックすると、この端末でも使えるようになります。",
  };
}

/** メールアドレスのみでログイン（Service Role Key 不要） */
export async function loginWithEmail(email: string): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    console.error("[auth/login] Supabase 未設定 — npm run setup:env を実行してください");
    return {
      ok: false,
      error:
        "Supabase が未設定です。npm run setup:env -- <Reference ID> を実行してください。",
    };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email?.toLowerCase() === normalized) {
    localStorage.setItem(SAVED_EMAIL_KEY, normalized);
    await ensureDeviceCredentials(normalized);
    return { ok: true };
  }

  const storedPassword = getDevicePassword(normalized);
  if (storedPassword) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password: storedPassword,
    });

    if (!error && data.session) {
      localStorage.setItem(SAVED_EMAIL_KEY, normalized);
      console.info("[auth/login] signInWithPassword 成功:", normalized);
      return { ok: true };
    }

    console.warn("[auth/login] 端末パスワードでのログイン失敗:", error?.message);
    removeDevicePassword(normalized);
  }

  const newPassword = generateDevicePassword();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: normalized,
    password: newPassword,
  });

  if (!signUpError && signUpData.session) {
    saveDevicePassword(normalized, newPassword);
    localStorage.setItem(SAVED_EMAIL_KEY, normalized);
    console.info("[auth/login] signUp 成功（セッション取得）:", normalized);
    return { ok: true };
  }

  if (!signUpError && signUpData.user && !signUpData.session) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalized,
      password: newPassword,
    });

    if (!signInError && signInData.session) {
      saveDevicePassword(normalized, newPassword);
      localStorage.setItem(SAVED_EMAIL_KEY, normalized);
      console.info("[auth/login] signUp 後 signIn 成功:", normalized);
      return { ok: true };
    }

    console.error("[auth/login] signUp 後セッションなし:", {
      signInError: signInError?.message,
      emailConfirmed: signUpData.user.email_confirmed_at,
    });

    return {
      ok: false,
      error:
        "登録は完了しましたが、ログインにはメール確認が必要です。Supabase で Confirm email を OFF にするか、確認メールのリンクをクリックしてください。",
    };
  }

  if (signUpError) {
    console.error("[auth/login] signUp error:", {
      message: signUpError.message,
      status: signUpError.status,
      name: signUpError.name,
    });

    const msg = signUpError.message.toLowerCase();
    if (msg.includes("already") || signUpError.status === 422) {
      return sendRecoveryOtp(normalized);
    }

    return { ok: false, error: mapAuthError(signUpError) };
  }

  console.error("[auth/login] 不明な失敗:", signUpData);
  return { ok: false, error: "ログインに失敗しました。" };
}
