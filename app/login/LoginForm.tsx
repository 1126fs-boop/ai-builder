"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/index.html";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__badge">株式会社ワム · 営業チーム</div>
        <h1 className="login__title">AI Builder</h1>
        <p className="login__subtitle">営業メンバー専用プロンプト生成アプリ</p>

        <form onSubmit={handleLogin} className="login__form">
          <label className="login__label">
            メールアドレス
            <input
              type="email"
              className="login__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@wamu-gr.co.jp"
              required
              autoComplete="email"
            />
          </label>
          <label className="login__label">
            パスワード
            <input
              type="password"
              className="login__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="login__error">{error}</p>}
          <button type="submit" className="login__btn" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="login__help">
          アカウント未発行の方は管理者にお問い合わせください。
        </p>
      </div>

      <style jsx>{`
        .login {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(160deg, #eff6ff 0%, #f7f7f8 50%, #ffffff 100%);
        }
        .login__card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border: 1px solid #ececf1;
          border-radius: 20px;
          padding: 32px 28px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
        }
        .login__badge {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #2563eb;
          background: #eff6ff;
          padding: 5px 12px;
          border-radius: 9999px;
          margin-bottom: 16px;
        }
        .login__title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }
        .login__subtitle {
          font-size: 0.875rem;
          color: #6e6e80;
          margin-bottom: 28px;
        }
        .login__form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login__label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #6e6e80;
        }
        .login__input {
          padding: 14px 16px;
          font-size: 1rem;
          border: 1.5px solid #ececf1;
          border-radius: 10px;
          outline: none;
          min-height: 48px;
        }
        .login__input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .login__error {
          font-size: 0.85rem;
          color: #dc2626;
          background: #fef2f2;
          padding: 10px 12px;
          border-radius: 8px;
        }
        .login__btn {
          min-height: 48px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          background: #2563eb;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 4px;
        }
        .login__btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login__help {
          margin-top: 20px;
          font-size: 0.78rem;
          color: #acacbe;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
