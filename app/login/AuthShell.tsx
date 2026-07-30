"use client";

import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

/** ログイン・新規登録画面の共通レイアウト */
export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="login">
      <div className="login__card">
        <div className="login__badge">株式会社ワム · 営業チーム</div>
        <h1 className="login__title">{title}</h1>
        <p className="login__subtitle">{subtitle}</p>
        {children}
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
      `}</style>
    </div>
  );
}
