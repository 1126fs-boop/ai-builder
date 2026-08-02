"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { withTimeout } from "@/lib/auth/async-utils";
import { validateEmail, validatePassword } from "@/lib/auth/validation";
import { signInWithPassword, getSessionUser } from "@/lib/auth/password-auth";
import { mapAuthError } from "@/lib/auth/errors";
import { navigateToAppPath } from "@/lib/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import AuthShell from "./AuthShell";
import "./auth-form.css";

const AUTH_TIMEOUT_MS = 12_000;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/index.html";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        if (!isSupabaseConfigured()) {
          setError(
            "Supabase が未設定です。Vercel の環境変数を確認し、再デプロイしてください。"
          );
          return;
        }

        const user = await withTimeout(
          getSessionUser(),
          AUTH_TIMEOUT_MS,
          "Supabase への接続がタイムアウトしました。"
        );

        if (user) {
          navigateToAppPath(redirect, router, "replace");
        }
      } catch (err) {
        setError(mapAuthError(err instanceof Error ? err : null));
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);

    if (!emailResult.valid || !passwordResult.valid) {
      setFieldErrors({
        email: emailResult.valid ? undefined : emailResult.message,
        password: passwordResult.valid ? undefined : passwordResult.message,
      });
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});

    const result = await signInWithPassword(email, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    navigateToAppPath(redirect, router);
  }

  if (checking) {
    return (
      <AuthShell title="AI Builder" subtitle="読み込み中...">
        <p className="login__help">ログイン状態を確認しています</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="AI Builder" subtitle="メールアドレスとパスワードでログイン">
      <form onSubmit={handleSubmit} className="login__form" noValidate>
        <label className="login__label">
          会社メールアドレス
          <input
            type="email"
            className={`login__input${fieldErrors.email ? " login__input--error" : ""}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder="name@wamu-gr.co.jp"
            autoComplete="email"
            inputMode="email"
            autoFocus
          />
          {fieldErrors.email && (
            <span className="login__field-error">{fieldErrors.email}</span>
          )}
        </label>

        <label className="login__label">
          パスワード
          <input
            type="password"
            className={`login__input${fieldErrors.password ? " login__input--error" : ""}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            placeholder="8文字以上"
            autoComplete="current-password"
          />
          {fieldErrors.password && (
            <span className="login__field-error">{fieldErrors.password}</span>
          )}
        </label>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="login__btn" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <div className="login__links">
        <Link href="/login/signup" className="login__link">
          新規登録はこちら
        </Link>
      </div>

      <p className="login__help">
        ログイン状態は保持されます。
        <br />
        iPhone・PC・iPad など同じアカウントでログインできます。
      </p>
    </AuthShell>
  );
}
