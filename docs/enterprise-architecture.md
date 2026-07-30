# エンタープライズアーキテクチャ — 株式会社ワム 営業全員向け

## 概要

AI Builder を個人利用（LocalStorage）から **営業メンバー全員が利用する Web アプリ** へ移行する。

| 項目 | v1.0（個人） | v2.0（チーム） |
|---|---|---|
| 認証 | なし | Supabase Auth（メール/パスワード） |
| データ保存 | 端末 LocalStorage | PostgreSQL（ユーザーごと） |
| テンプレート | なし | 共通テンプレート（全員参照） |
| 商品情報 | 静的 JS | DB 管理（管理者更新） |
| ホスティング | 静的ファイル | Vercel + Next.js |
| 権限 | なし | member / admin |

---

## システム構成

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (HTTPS)                        │
├─────────────────────────────────────────────────────────┤
│  Next.js App Router                                      │
│  ├── /login          認証画面                            │
│  ├── /admin          管理者パネル（admin のみ）           │
│  ├── /auth/callback  OAuth / メール確認コールバック       │
│  └── middleware      ルート保護                           │
├─────────────────────────────────────────────────────────┤
│  public/ — 営業アプリ（認証後）                           │
│  ├── index.html      AI Builder 本体                      │
│  ├── js/             ES Modules                          │
│  └── storage         Supabase 連携                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase                              │
│  ├── Auth            ユーザー認証                         │
│  ├── PostgreSQL      データ永続化                         │
│  └── RLS             行レベルセキュリティ                  │
└─────────────────────────────────────────────────────────┘
```

---

## データモデル

### profiles（ユーザープロフィール）
- `auth.users` と 1:1
- `role`: `member` | `admin`
- 営業メンバー全員に `member`、管理者に `admin`

### saved_ais（保存 AI — ユーザーごと）
- 生成プロンプト・回答・品質スコア
- RLS: 本人のみ CRUD

### templates（共通テンプレート）
- カテゴリ別プロンプトテンプレート
- 全 `member` が参照、 `admin` のみ CRUD

### products（商品マスタ — 管理者管理）
- 株式会社ワム公式 HP 準拠の商品情報
- 画像生成時のみ参照（既存仕様を維持）
- 全員参照、 `admin` のみ CRUD

---

## 権限設計

| 操作 | member | admin |
|---|---|---|
| ログイン / アプリ利用 | ✅ | ✅ |
| 自分の AI 保存・削除 | ✅ | ✅ |
| 共通テンプレート参照 | ✅ | ✅ |
| 商品情報参照 | ✅ | ✅ |
| テンプレート作成・編集 | ❌ | ✅ |
| 商品情報更新 | ❌ | ✅ |
| ユーザー管理 | ❌ | 🔲 将来 |

---

## スケーラビリティ

- **Vercel**: サーバーレス自動スケール、CDN 配信
- **Supabase**: マネージド PostgreSQL、Auth 分離、RLS でアプリ層を薄く保つ
- **PWA**: 静的アセット CDN キャッシュ + Service Worker
- **将来**: Supabase Storage（商品画像）、SSO（Google Workspace @wamu）、監査ログ

---

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # サーバー/admin API のみ
NEXT_PUBLIC_APP_URL=         # https://your-app.vercel.app
```

---

## デプロイフロー

1. Supabase プロジェクト作成 → SQL マイグレーション実行
2. Vercel に GitHub 連携 → 環境変数設定
3. 初回 admin ユーザーを Supabase Dashboard で `profiles.role = 'admin'` に設定
4. 営業メンバーに `/login` URL を共有
