"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withTimeout } from "@/lib/auth/async-utils";
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/auth/validation";
import { signUpWithPassword, getSessionUser } from "@/lib/auth/password-auth";
import { mapAuthError } from "@/lib/auth/errors";
import { navigateToAppPath } from "@/lib/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import AuthShell from "../AuthShell";
import "../auth-form.css";

const AUTH_TIMEOUT_MS = 12_000;

export default function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        if (!isSupabaseConfigured()) {
          setError("Supabase が未設定です。環境変数を確認してください。");
          return;
        }

        const user = await withTimeout(
          getSessionUser(),
          AUTH_TIMEOUT_MS,
          "Supabase への接続がタイムアウトしました。"
        );

        if (user) {
          navigateToAppPath("/index.html", router, "replace");
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
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameResult = validateFullName(fullName);
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    const confirmResult = validatePasswordConfirm(password, confirmPassword);

    if (
      !nameResult.valid ||
      !emailResult.valid ||
      !passwordResult.valid ||
      !confirmResult.valid
    ) {
      setFieldErrors({
        fullName: nameResult.valid ? undefined : nameResult.message,
        email: emailResult.valid ? undefined : emailResult.message,
        password: passwordResult.valid ? undefined : passwordResult.message,
        confirmPassword: confirmResult.valid ? undefined : confirmResult.message,
      });
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});

    const result = await signUpWithPassword(fullName, email, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    navigateToAppPath("/index.html", router);
  }

  if (checking) {
    return (
      <AuthShell title="新規登録" subtitle="読み込み中...">
        <p className="login__help">確認しています</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="新規登録" subtitle="アカウントを作成して AI Builder を始めましょう">
      <form onSubmit={handleSubmit} className="login__form" noValidate>
        <label className="login__label">
          氏名
          <input
            type="text"
            className={`login__input${fieldErrors.fullName ? " login__input--error" : ""}`}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
            }}
            placeholder="山田 太郎"
            autoComplete="name"
            autoFocus
          />
          {fieldErrors.fullName && (
            <span className="login__field-error">{fieldErrors.fullName}</span>
          )}
        </label>

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
            autoComplete="new-password"
          />
          {fieldErrors.password && (
            <span className="login__field-error">{fieldErrors.password}</span>
          )}
        </label>

        <label className="login__label">
          パスワード（確認）
          <input
            type="password"
            className={`login__input${fieldErrors.confirmPassword ? " login__input--error" : ""}`}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
              }
            }}
            placeholder="もう一度入力"
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword && (
            <span className="login__field-error">{fieldErrors.confirmPassword}</span>
          )}
        </label>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="login__btn" disabled={loading}>
          {loading ? "登録中..." : "アカウントを作成"}
        </button>
      </form>

      <div className="login__links">
        <Link href="/login" className="login__link">
          ログイン画面に戻る
        </Link>
      </div>

      <p className="login__help">
        登録後、自動的にログインします。
        <br />
        メール確認は不要です。
      </p>
    </AuthShell>
  );
}
