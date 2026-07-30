# AI Builder v2.0

**株式会社ワム** 営業メンバー全員向けの Web アプリ。  
美容 BtoB メーカーのソリューション営業プロンプトを、質問に答えるだけで生成できます。

## 主な機能

| 機能 | 説明 |
|---|---|
| **ログイン** | Supabase Auth によるメール/パスワード認証 |
| **ユーザーごとの保存** | 生成した AI プロンプトをクラウドに保存（端末をまたいで利用可能） |
| **共通テンプレート** | 全営業メンバーで共有。管理者が登録・更新 |
| **管理者パネル** | テンプレート・商品情報の CRUD（`/admin`） |
| **AI 作成ウィザード** | カテゴリ別質問フロー |
| **AI ライブラリ** | 保存一覧・検索・お気に入り・削除 |
| **品質診断 & AI 評価** | 4 軸スコア・S〜D グレード |
| **PWA** | PC・スマホ対応。ホーム画面に追加可能 |

## 技術スタック

| レイヤ | 技術 |
|---|---|
| フロント（メインアプリ） | HTML / CSS / JavaScript（ES Modules） |
| フロント（認証・管理） | Next.js 14 App Router |
| バックエンド / DB | Supabase（Auth + PostgreSQL + RLS） |
| ホスティング | Vercel |
| PWA | Service Worker + Web App Manifest |

---

## iPhone から使う（Vercel デプロイ）

ローカル（`localhost`）は iPhone から開けません。**Vercel にデプロイして HTTPS の URL を取得** すれば、外出先の iPhone からも利用できます。

### コード側で準備済みのもの

| 項目 | ファイル |
|---|---|
| Vercel 設定 | `vercel.json` |
| 環境変数テンプレート | `.env.vercel.example` |
| PWA（ホーム画面追加） | `public/manifest.webmanifest` + `public/sw.js` |
| レスポンシブ | `public/style.css`（640px 以下最適化） |
| PWA アイコン | `public/icons/icon-192.png` / `icon-512.png` |

GitHub リポジトリ: **https://github.com/1126fs-boop/ai-builder**  
デプロイ推奨ブランチ: **`cursor/ai-builder-web-app`**

---

### あなたが行う作業（手順概要）

詳細は **[docs/deploy-iphone.md](docs/deploy-iphone.md)** を参照してください。

#### ステップ 1 — Supabase を準備

1. https://supabase.com にログイン → **New project** でプロジェクト作成
2. **SQL Editor** で `supabase/migrations/001_enterprise.sql` を実行
3. **Project Settings → API** から URL と anon キーを控える
4. **Authentication → Providers → Email** で **Enable sign ups** を ON

#### ステップ 2 — GitHub に push

```powershell
cd c:\Users\user\ai-builder
git add .
git commit -m "Prepare Vercel deploy for iPhone access"
git push origin cursor/ai-builder-web-app
```

#### ステップ 3 — Vercel にデプロイ

1. https://vercel.com を開く → **Continue with GitHub** でログイン
2. **Add New… → Project** → **`1126fs-boop/ai-builder`** を **Import**
3. Production Branch を `cursor/ai-builder-web-app` に設定
4. **Deploy** をクリック → **Ready** になるまで待つ
5. 表示された URL（例: `https://ai-builder-xxxx.vercel.app`）を控える

#### ステップ 4 — 環境変数を設定 → 再デプロイ

Vercel → **Settings → Environment Variables** に以下を追加（Production / Preview / Development すべて）:

| 変数名 | 値 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon キー |
| `NEXT_PUBLIC_APP_URL` | Vercel の URL |

追加後、**Deployments → ⋯ → Redeploy** をクリック。

#### ステップ 5 — Supabase に本番 URL を登録

**Authentication → URL Configuration** で設定:

| 項目 | 値 |
|---|---|
| Site URL | `https://ai-builder-xxxx.vercel.app` |
| Redirect URLs | `https://.../auth/callback` と `https://.../login/reset-password` |

#### ステップ 6 — iPhone で開く

1. Safari で Vercel の URL を開く
2. **新規登録** または **ログイン**
3. 共有ボタン → **ホーム画面に追加**（PWA）

---

### 環境変数（Vercel に設定）

| 変数名 | 説明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public キー |
| `NEXT_PUBLIC_APP_URL` | 本番 URL（例: `https://ai-builder-xxxx.vercel.app`） |

テンプレート: `.env.vercel.example`

---

## ローカル開発

### 前提

Node.js 18 以上、`npm install` 済み

### 環境変数

`.env.local` を作成（`.env.example` を参照）:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 起動

```bash
npm install
npm run dev
```

http://localhost:3000 で起動。ログイン後 `/index.html` にリダイレクトされます。

**静的ファイルのみ**（ログインなし・LocalStorage モード）を試す場合:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

---

## セットアップ（Supabase 詳細）

### 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. **SQL Editor** で `supabase/migrations/001_enterprise.sql` を実行
3. **Authentication → Users** で営業メンバーのアカウントを作成
4. 最初の管理者は SQL でロールを付与:

```sql
update public.profiles set role = 'admin' where email = 'admin@wamu-gr.co.jp';
```

---

## Vercel へのデプロイ（技術メモ）

| 項目 | 値 |
|---|---|
| Framework Preset | Next.js（`vercel.json` で指定） |
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Node.js | 18.17.0 以上（`package.json` の `engines`） |

GitHub に push すると Vercel が自動再デプロイ（連携後）。

PWA アイコン再生成: `npm run generate:icons`

---

## ユーザー管理

| ロール | 権限 |
|---|---|
| `member` | アプリ利用・自分の AI 保存・共通テンプレート閲覧 |
| `admin` | 上記 + `/admin` でテンプレート・商品情報の管理 |

新規ユーザーは Supabase Dashboard または Admin API で作成。初回ログイン時に `profiles` テーブルへ自動登録されます。

---

## スマートフォン（PWA）

デプロイ済みの **HTTPS URL** をスマホのブラウザで開き、ホーム画面に追加します。

### iPhone（Safari）

1. Safari でアプリの URL を開く
2. 共有ボタン → **ホーム画面に追加**

### Android（Chrome）

1. Chrome でアプリの URL を開く
2. メニュー → **ホーム画面に追加** または **アプリをインストール**

---

## ディレクトリ構成

```
ai-builder/
├── app/                  # Next.js（ログイン・管理・API）
│   ├── login/
│   ├── admin/
│   └── api/config/
├── public/               # メインアプリ（静的 ES Modules）
│   ├── index.html
│   ├── js/
│   └── icons/
├── lib/supabase/         # Supabase クライアント
├── supabase/migrations/  # DB スキーマ
└── docs/                 # 設計ドキュメント
```

詳細なアーキテクチャは `docs/enterprise-architecture.md` を参照してください。

---

## ライセンス

株式会社ワム 内部利用
