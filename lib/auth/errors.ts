import type { AuthError } from "@supabase/supabase-js";

/** Supabase Auth のエラーを日本語メッセージに変換 */
export function mapAuthError(error: AuthError | Error | null | undefined): string {
  if (!error) return "ログインに失敗しました。";

  const message = error.message.toLowerCase();
  const name = "name" in error ? String(error.name).toLowerCase() : "";

  if (message.includes("failed to fetch") || name.includes("fetch")) {
    return "Supabase に接続できません。環境変数（URL・anon キー）を確認してください。";
  }

  if (message.includes("invalid api key") || message.includes("invalid jwt")) {
    return "Supabase の anon キーが正しくありません。Project Settings → API を確認してください。";
  }

  if (message.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }

  if (message.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。管理者に Supabase の Confirm email 設定を確認してください。";
  }

  if (
    message.includes("already") ||
    message.includes("user already registered") ||
    message.includes("user_already_exists")
  ) {
    return "このメールアドレスは既に登録されています。ログイン画面からサインインしてください。";
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "リクエストが多すぎます。しばらく時間をおいてから再度お試しください。";
  }

  if (message.includes("invalid email") || message.includes("email address")) {
    return "正しいメールアドレスの形式で入力してください。";
  }

  if (message.includes("signup is disabled") || message.includes("signups not allowed")) {
    return "Supabase で「Enable sign ups」を ON にしてください。";
  }

  if (message.includes("password") && message.includes("least")) {
    return "パスワードは8文字以上で入力してください。";
  }

  if (message.includes("session") && message.includes("missing")) {
    return "セッションの有効期限が切れました。もう一度ログインしてください。";
  }

  console.error("[auth] 未分類のエラー:", error.message, error);
  return `認証に失敗しました（${error.message}）`;
}
