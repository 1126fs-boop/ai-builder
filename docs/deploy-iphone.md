# iPhone から使う — デプロイ手順書

このドキュメントは **あなた（管理者）がブラウザ上で行う作業** を、順番どおりに案内します。  
コードの準備はリポジトリ側で完了しています。以下の手順に従えば、iPhone の Safari から URL を開くだけで AI Builder を利用できます。

---

## 全体の流れ

```
① Supabase 準備（DB・ユーザー）
    ↓
② GitHub に最新コードがあることを確認
    ↓
③ Vercel にログイン → GitHub 連携 → デプロイ
    ↓
④ Vercel に環境変数を設定 → 再デプロイ
    ↓
⑤ Supabase に本番 URL を登録
    ↓
⑥ iPhone の Safari で URL を開く
```

所要時間の目安: **30〜60 分**（初回）

---

## 事前準備

| 必要なもの | 用途 |
|---|---|
| GitHub アカウント | ソースコード管理・Vercel 連携 |
| [Supabase](https://supabase.com) アカウント | ログイン・データ保存（無料枠で可） |
| [Vercel](https://vercel.com) アカウント | 本番ホスティング（無料枠で可） |
| iPhone（Safari） | 利用端末 |

リポジトリ URL: **https://github.com/1126fs-boop/ai-builder**  
デプロイ推奨ブランチ: **`cursor/ai-builder-web-app`**（または `main` にマージ後）

---

## ステップ 1 — Supabase を準備する

### 1-1. プロジェクト作成

1. https://supabase.com にログイン
2. **New project** をクリック
3. プロジェクト名（例: `ai-builder-wam`）・パスワード・リージョン（**Northeast Asia (Tokyo)** 推奨）を入力
4. **Create new project** をクリック
5. プロジェクトが起動するまで 1〜2 分待つ

### 1-2. データベース初期化

1. 左メニュー **SQL Editor** を開く
2. **New query** をクリック
3. リポジトリの `supabase/migrations/001_enterprise.sql` の内容をすべてコピーして貼り付け
4. **Run** をクリック
5. エラーが出ないことを確認

### 1-3. API キーを控える

1. 左メニュー **Project Settings**（歯車）→ **API**
2. 以下をメモ帳にコピー:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1-4. 営業メンバーのアカウント作成

1. 左メニュー **Authentication** → **Users**
2. **Add user** → **Create new user**
3. メールアドレスとパスワードを入力（例: `member@wamu-gr.co.jp`）
4. **Create user** をクリック
5. 必要な人数分繰り返す

### 1-5. 管理者ロール付与（任意）

1. **SQL Editor** で以下を実行（メールアドレスを変更）:

```sql
update public.profiles set role = 'admin' where email = 'admin@wamu-gr.co.jp';
```

---

## ステップ 2 — GitHub を確認する

Vercel は GitHub からコードを取得してデプロイします。

1. ブラウザで https://github.com/1126fs-boop/ai-builder を開く
2. ブランチ **`cursor/ai-builder-web-app`** を選択
3. 以下のファイルがあることを確認:
   - `vercel.json`
   - `package.json`
   - `next.config.mjs`
   - `public/index.html`
   - `public/manifest.webmanifest`

> 最新の変更が GitHub に push されていない場合は、開発担当者に push を依頼するか、ご自身で push してください。

---

## ステップ 3 — Vercel にデプロイする

### 3-1. Vercel にログイン

1. https://vercel.com を開く
2. **Sign Up** または **Log In** をクリック
3. **Continue with GitHub** を選択
4. GitHub の認可画面で **Authorize Vercel** をクリック

### 3-2. プロジェクトをインポート

1. Vercel ダッシュボードで **Add New…** → **Project** をクリック
2. **Import Git Repository** の一覧から **`1126fs-boop/ai-builder`** を探す
   - 見つからない場合: **Adjust GitHub App Permissions** からリポジトリへのアクセスを許可
3. **Import** をクリック

### 3-3. ビルド設定を確認（そのままで OK）

| 項目 | 設定値 |
|---|---|
| Framework Preset | **Next.js**（自動検出） |
| Root Directory | `./`（空白のまま） |
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Output Directory | （Next.js 自動） |

4. **Environment Variables** はこの時点ではスキップしてよい（次のステップで設定）
5. **Deploy** をクリック
6. ビルド完了まで 2〜5 分待つ（初回は環境変数未設定のためログインは動かないが、デプロイ自体は成功する）

### 3-4. 本番 URL を確認

1. デプロイ完了後、**Visit** をクリック
2. URL の形式: `https://ai-builder-xxxx.vercel.app`
3. この URL をメモ帳に控える → **`NEXT_PUBLIC_APP_URL`** および iPhone で開くアドレス

---

## ステップ 4 — 環境変数を設定して再デプロイ

### 4-1. 環境変数の追加

1. Vercel ダッシュボード → 対象プロジェクトを開く
2. 上部タブ **Settings** → 左メニュー **Environment Variables**
3. 以下を **1 行ずつ** 追加（Environment は **Production / Preview / Development** すべてにチェック）:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ステップ 1-3 で控えた Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ステップ 1-3 で控えた anon public キー |
| `NEXT_PUBLIC_APP_URL` | `https://ai-builder-xxxx.vercel.app`（実際の URL） |

4. 各行の **Save** をクリック

### 4-2. 再デプロイ

1. 上部タブ **Deployments** を開く
2. 最新デプロイの **⋯**（三点メニュー）→ **Redeploy** をクリック
3. **Redeploy** を確認
4. 完了まで 2〜5 分待つ

---

## ステップ 5 — Supabase に本番 URL を登録

1. Supabase ダッシュボード → 対象プロジェクト
2. **Authentication** → **URL Configuration**
3. 以下を設定:

| 項目 | 値 |
|---|---|
| **Site URL** | `https://ai-builder-xxxx.vercel.app` |
| **Redirect URLs** | `https://ai-builder-xxxx.vercel.app/auth/callback` |

4. **Save** をクリック

---

## ステップ 6 — iPhone から利用する

### 6-1. ブラウザで開く

1. iPhone の **Safari** を開く
2. アドレスバーに Vercel の URL（例: `https://ai-builder-xxxx.vercel.app`）を入力
3. **ログイン画面** が表示されることを確認
4. ステップ 1-4 で作成したメール・パスワードでログイン
5. AI Builder のホーム画面が表示されれば成功

### 6-2. ホーム画面に追加（PWA）

1. Safari 画面下の **共有ボタン**（□に↑）をタップ
2. **ホーム画面に追加** をタップ
3. 名前「AI Builder」のまま **追加** をタップ
4. ホーム画面のアイコンからアプリのように起動できる

### 6-3. 動作確認チェックリスト

- [ ] ログインできる
- [ ] 「＋ 新しい AI を作る」でウィザードが動く
- [ ] プロンプト生成が完了する（ローディングが止まらない）
- [ ] 画面が iPhone 幅に収まる（横スクロールなし）
- [ ] ホーム画面追加後、アイコンから起動できる

---

## うまくいかないとき

| 症状 | 確認すること |
|---|---|
| ログインできない | Supabase の Site URL / Redirect URLs が Vercel URL と一致しているか |
| 真っ白な画面 | Vercel の Environment Variables が 3 つすべて設定されているか |
| ビルド失敗 | Vercel の Deployments → 失敗したデプロイ → **Building** ログを確認 |
| PWA が追加できない | HTTPS の URL で開いているか（`https://` 必須） |
| 保存が反映されない | Supabase SQL マイグレーションが実行済みか |

---

## 更新を反映するには

コードを GitHub に push すると、Vercel が自動的に再デプロイします（Git 連携時）。

1. GitHub に push
2. Vercel **Deployments** タブで新しいデプロイが始まるのを確認
3. **Ready** になったら iPhone で再度アクセス

---

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `vercel.json` | Vercel ビルド・PWA ヘッダー設定 |
| `next.config.mjs` | Next.js 設定 |
| `package.json` | 依存関係・ビルドコマンド |
| `.env.example` | 環境変数のテンプレート |
| `public/manifest.webmanifest` | PWA マニフェスト |
| `public/sw.js` | Service Worker |
