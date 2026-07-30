"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { withTimeout } from "@/lib/auth/async-utils";
import { validateEmail } from "@/lib/auth/validation";
import { loginWithEmail, getSavedEmail } from "@/lib/auth/email-login";
import { mapAuthError } from "@/lib/auth/errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import AuthShell from "./AuthShell";
import "./auth-form.css";

const AUTH_TIMEOUT_MS = 12_000;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/index.html";

  const savedEmail = getSavedEmail();
  const [email, setEmail] = useState(savedEmail || "");
  const [loading, setLoading] = useState(Boolean(savedEmail));
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function tryAutoLogin() {
      try {
        if (!isSupabaseConfigured()) {
          setError(
            "Supabase が未設定です。Vercel の環境変数（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_APP_URL）を確認し、再デプロイしてください。"
          );
          return;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await withTimeout(
          supabase.auth.getUser(),
          AUTH_TIMEOUT_MS,
          "Supabase への接続がタイムアウトしました。URL または anon キーを確認してください。"
        );

        if (user) {
          router.replace(redirect);
          router.refresh();
          return;
        }

        const saved = getSavedEmail();
        if (saved) {
          setLoading(true);
          const result = await withTimeout(
            loginWithEmail(saved),
            AUTH_TIMEOUT_MS,
            "ログイン処理がタイムアウトしました。Supabase の設定を確認してください。"
          );
          if (result.ok) {
            router.replace(redirect);
            router.refresh();
            return;
          }
          setError(result.error);
          if (result.pendingEmail) setSuccess(result.error);
          setLoading(false);
        }
      } catch (err) {
        setError(mapAuthError(err instanceof Error ? err : null));
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    tryAutoLogin();
    return () => {
      cancelled = true;
    };
  }, [redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateEmail(email);
    if (!validation.valid) {
      setFieldError(validation.message);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setFieldError("");

    const result = await loginWithEmail(email);
    if (!result.ok) {
      if (result.pendingEmail) {
        setSuccess(result.error);
        setError("");
      } else {
        setError(result.error);
      }
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  if (checking) {
    return (
      <AuthShell title="AI Builder" subtitle="読み込み中...">
        <p className="login__help">ログイン状態を確認しています</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="AI Builder"
      subtitle="メールアドレスを入力して開始してください"
    >
      <form onSubmit={handleSubmit} className="login__form" noValidate>
        <label className="login__label">
          メールアドレス
          <input
            type="email"
            className={`login__input${fieldError ? " login__input--error" : ""}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError("");
            }}
            placeholder="name@wamu-gr.co.jp"
            autoComplete="email"
            inputMode="email"
            autoFocus
            disabled={Boolean(success)}
          />
          {fieldError && <span className="login__field-error">{fieldError}</span>}
        </label>

        {error && <p className="login__error" role="alert">{error}</p>}
        {success && <p className="login__success" role="status">{success}</p>}

        {!success && (
          <button type="submit" className="login__btn" disabled={loading}>
            {loading ? "ログイン中..." : "はじめる"}
          </button>
        )}
      </form>

      <p className="login__help">
        初回のみメールアドレスの入力が必要です。
        <br />
        次回以降は自動的にログインします。
      </p>
    </AuthShell>
  );
}
