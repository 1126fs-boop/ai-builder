import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth/errors";
import { SAVED_EMAIL_KEY } from "@/lib/auth/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthResult = { ok: true } | { ok: false; error: string };

/** ログイン成功時にメールを保存（localStorage キー分離用） */
function persistUserEmail(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_EMAIL_KEY, email.trim().toLowerCase());
}

/** メールアドレス＋パスワードでログイン */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase が未設定です。環境変数を確認し、再デプロイしてください。",
    };
  }

  const supabase = createClient();
  const normalized = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) {
    console.error("[auth/signin]", error.message);
    return { ok: false, error: mapAuthError(error) };
  }

  if (!data.session) {
    return { ok: false, error: "ログインに失敗しました。もう一度お試しください。" };
  }

  persistUserEmail(normalized);
  return { ok: true };
}

/** 新規登録（氏名・メール・パスワード）— Confirm Email なし想定 */
export async function signUpWithPassword(
  fullName: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase が未設定です。環境変数を確認し、再デプロイしてください。",
    };
  }

  const supabase = createClient();
  const normalized = email.trim().toLowerCase();
  const name = fullName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    console.error("[auth/signup]", error.message);
    return { ok: false, error: mapAuthError(error) };
  }

  // Confirm Email OFF の場合はセッションが返る
  if (data.session) {
    persistUserEmail(normalized);
    return { ok: true };
  }

  // セッションがない場合はパスワードで再ログインを試行
  if (data.user) {
    const signIn = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (!signIn.error && signIn.data.session) {
      persistUserEmail(normalized);
      return { ok: true };
    }

    if (signIn.error) {
      return { ok: false, error: mapAuthError(signIn.error) };
    }
  }

  return {
    ok: false,
    error:
      "登録は完了しましたが、ログインできませんでした。Supabase で Confirm email を OFF にしてください。",
  };
}

/** 現在のセッションを確認 */
export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
