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

## セットアップ

### 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. **SQL Editor** で `supabase/migrations/001_enterprise.sql` を実行
3. **Authentication → Users** で営業メンバーのアカウントを作成
4. 最初の管理者は SQL でロールを付与:

```sql
update public.profiles set role = 'admin' where email = 'admin@wamu-gr.co.jp';
```

### 2. 環境変数

`.env.local` を作成（`.env.example` を参照）:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. ローカル開発

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

## Vercel へのデプロイ

1. GitHub リポジトリ `https://github.com/1126fs-boop/ai-builder` を Vercel に接続
2. **Framework Preset**: Next.js（自動検出）
3. **Environment Variables** に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`（本番 URL）
4. デプロイ

Supabase の **Authentication → URL Configuration** に本番 URL を追加:

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
