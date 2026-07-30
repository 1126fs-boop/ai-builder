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

## iPhone から使う（本番デプロイ）

ローカル環境ではなく **iPhone の Safari から URL を開いて使う** には、Vercel へデプロイします。

### 構成（Vercel デプロイ済み）

| 項目 | 状態 |
|---|---|
| Vercel 設定 | `vercel.json` |
| Next.js ビルド | `npm run build` |
| GitHub 連携 | `1126fs-boop/ai-builder` |
| レスポンシブ | `public/style.css`（640px 以下最適化） |
| PWA | `manifest.webmanifest` + `sw.js` + iPhone メタタグ |

### あなたが行う作業（概要）

詳細は **[docs/deploy-iphone.md](docs/deploy-iphone.md)** を参照してください。

1. **Supabase** — プロジェクト作成 → SQL 実行 → ユーザー作成 → API キーを控える
2. **GitHub** — リポジトリ `1126fs-boop/ai-builder` に最新コードがあることを確認
3. **Vercel** — GitHub でログイン → リポジトリを Import → **Deploy**
4. **Vercel** — Settings → Environment Variables に 3 変数を追加 → **Redeploy**
5. **Supabase** — Authentication → URL Configuration に Vercel の URL を登録
6. **iPhone** — Safari で Vercel の URL を開く → ログイン → ホーム画面に追加

### 環境変数（Vercel に設定）

| 変数名 | 説明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public キー |
| `NEXT_PUBLIC_APP_URL` | 本番 URL（例: `https://ai-builder-xxxx.vercel.app`） |

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

- **Framework Preset**: Next.js（`vercel.json` で指定）
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- GitHub に push すると Vercel が自動再デプロイ（連携後）

Supabase の **Authentication → URL Configuration**:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

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
