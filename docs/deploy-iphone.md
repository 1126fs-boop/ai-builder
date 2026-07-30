# iPhone から使う — Vercel デプロイ手順書

このドキュメントは **あなた（管理者）がブラウザ上で行う作業** を、ボタンを押すタイミングまで順番に案内します。  
コード側の準備（Vercel 設定・PWA・レスポンシブ）はリポジトリに含まれています。

---

## 全体の流れ

```
① Supabase を準備（DB・認証）
    ↓
② GitHub に最新コードを push
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
| [Supabase](https://supabase.com) アカウント | ログイン・新規登録・データ保存 |
| [Vercel](https://vercel.com) アカウント | 本番ホスティング（HTTPS） |
| iPhone（Safari） | 利用端末 |

| 項目 | 値 |
|---|---|
| GitHub リポジトリ | https://github.com/1126fs-boop/ai-builder |
| デプロイ推奨ブランチ | `cursor/ai-builder-web-app` |

---

## ステップ 1 — Supabase を準備する

### 1-1. プロジェクト作成

1. ブラウザで https://supabase.com を開く
2. **Sign In** でログイン
3. **New project** をクリック
4. プロジェクト名（例: `ai-builder-wam`）・DB パスワード・リージョン（**Northeast Asia (Tokyo)** 推奨）を入力
5. **Create new project** をクリック
6. ステータスが **Active** になるまで 1〜2 分待つ

### 1-2. データベース初期化

1. 左メニュー **SQL Editor** をクリック
2. **New query** をクリック
3. リポジトリの `supabase/migrations/001_enterprise.sql` の内容をすべてコピーして貼り付け
4. 右下 **Run**（または Ctrl+Enter）をクリック
5. 緑色の **Success** が出ることを確認

### 1-3. API キーを控える

1. 左メニュー **Project Settings**（歯車）→ **API**
2. メモ帳にコピー:
   - **Project URL** → 後で `NEXT_PUBLIC_SUPABASE_URL` に使う
   - **anon public** キー → 後で `NEXT_PUBLIC_SUPABASE_ANON_KEY` に使う

### 1-4. 認証（新規登録・パスワード再設定）の設定

1. 左メニュー **Authentication** → **Providers** → **Email**
2. 次を設定:

| 設定 | 推奨値 | 説明 |
|---|---|---|
| **Enable Email provider** | ON | メールログインを有効化 |
| **Enable sign ups** | ON | 新規登録を許可 |
| **Confirm email** | OFF（社内向け）または ON（セキュリティ重視） | OFF なら登録後すぐログイン可 |
| **Minimum password length** | **8** | アプリ側と一致 |

3. **Save** をクリック

> **Confirm email を ON にした場合**  
> 新規登録後、確認メールのリンクをクリックしないとログインできません。

### 1-5. 管理者アカウント（任意）

**Authentication** → **Users** → **Add user** → **Create new user** で管理者用アカウントを作成。

管理者権限を付与する場合は **SQL Editor** で:

```sql
update public.profiles set role = 'admin' where email = 'admin@wamu-gr.co.jp';
```

（メールアドレスは実際のものに変更）

---

## ステップ 2 — GitHub に最新コードを push する

Vercel は GitHub からコードを取得してデプロイします。**push 前に Vercel 連携はできません。**

### 2-1. ローカルで変更をコミット（開発担当者またはご自身）

ターミナル（PowerShell）でプロジェクトフォルダに移動し:

```powershell
cd c:\Users\user\ai-builder
git add .
git commit -m "Prepare Vercel deploy for iPhone access"
git push origin cursor/ai-builder-web-app
```

### 2-2. GitHub 上で確認

1. https://github.com/1126fs-boop/ai-builder を開く
2. ブランチ **`cursor/ai-builder-web-app`** を選択
3. 以下のファイルがあることを確認:
   - `vercel.json`
   - `package.json`
   - `public/manifest.webmanifest`
   - `public/sw.js`
   - `public/icons/icon-192.png`
   - `public/icons/icon-512.png`

---

## ステップ 3 — Vercel にデプロイする

### 3-1. Vercel にログイン

1. https://vercel.com を開く
2. 右上 **Sign Up** または **Log In** をクリック
3. **Continue with GitHub** を選択
4. GitHub の認可画面で **Authorize Vercel** をクリック

### 3-2. プロジェクトをインポート

1. Vercel ダッシュボードで **Add New…** → **Project** をクリック
2. **Import Git Repository** 一覧から **`1126fs-boop/ai-builder`** を探す
   - 見つからない場合: **Adjust GitHub App Permissions** → リポジトリ `ai-builder` にチェック → **Save**
3. リポジトリ右の **Import** をクリック

### 3-3. ビルド設定を確認

| 項目 | 設定値 |
|---|---|
| Framework Preset | **Next.js**（自動検出） |
| Root Directory | `./`（変更しない） |
| Build Command | `npm run build` |
| Install Command | `npm install` |

**Production Branch** を `cursor/ai-builder-web-app` に変更（`main` 以外を使う場合）。

### 3-4. 初回デプロイ

1. **Environment Variables** はこの時点では空のままで OK
2. 画面下部 **Deploy** をクリック
3. **Building…** → **Ready** になるまで 2〜5 分待つ
4. 完了後 **Visit** をクリックして URL を確認（例: `https://ai-builder-xxxx.vercel.app`）
5. **この URL をメモ帳に控える**（以降すべてここに使う）

---

## ステップ 4 — 環境変数を設定して再デプロイ

### 4-1. 環境変数の追加

1. Vercel ダッシュボード → プロジェクト **ai-builder** を開く
2. 上部 **Settings** タブ → 左 **Environment Variables**
3. 以下を **1 行ずつ** 追加（Environment は **Production / Preview / Development** すべてにチェック）:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ステップ 1-3 の Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ステップ 1-3 の anon public キー |
| `NEXT_PUBLIC_APP_URL` | `https://ai-builder-xxxx.vercel.app`（実際の URL） |

4. 各行入力後 **Save** をクリック

テンプレート: リポジトリの `.env.vercel.example` を参照。

### 4-2. 再デプロイ

1. 上部 **Deployments** タブを開く
2. 最新デプロイの右 **⋯**（三点メニュー）→ **Redeploy** をクリック
3. 確認ダイアログで **Redeploy** をクリック
4. **Ready** になるまで 2〜5 分待つ

---

## ステップ 5 — Supabase に本番 URL を登録

1. Supabase ダッシュボード → 対象プロジェクト
2. **Authentication** → **URL Configuration**
3. 以下を設定（`https://ai-builder-xxxx.vercel.app` は実際の Vercel URL に置き換え）:

| 項目 | 値 |
|---|---|
| **Site URL** | `https://ai-builder-xxxx.vercel.app` |
| **Redirect URLs** | 下記 2 行を **それぞれ追加** |

**Redirect URLs（2 行とも追加）:**

```
https://ai-builder-xxxx.vercel.app/auth/callback
https://ai-builder-xxxx.vercel.app/login/reset-password
```

4. **Save** をクリック

---

## ステップ 6 — iPhone から利用する

### 6-1. ブラウザで開く

1. iPhone の **Safari** を開く
2. アドレスバーに Vercel の URL を入力（例: `https://ai-builder-xxxx.vercel.app`）
3. **ログイン画面** が表示されることを確認
4. **新規登録** タブでアカウント作成、または既存アカウントで **ログイン**
5. AI Builder のホーム画面が表示されれば成功

### 6-2. ホーム画面に追加（PWA）

1. Safari 画面下の **共有ボタン**（□に↑）をタップ
2. 下にスクロール → **ホーム画面に追加** をタップ
3. 名前「AI Builder」のまま **追加** をタップ
4. ホーム画面のアイコンからアプリのように起動できる

### 6-3. 動作確認チェックリスト

- [ ] ログインできる
- [ ] 新規登録できる
- [ ] パスワード再設定メールが届く
- [ ] 「＋ 新しい AI を作る」でウィザードが動く
- [ ] 画面が iPhone 幅に収まる（横スクロールなし）
- [ ] ホーム画面追加後、アイコンから起動できる

---

## レスポンシブ・PWA 対応（コード側で実装済み）

| 項目 | ファイル | 内容 |
|---|---|---|
| レスポンシブ | `public/style.css` | 640px / 380px 以下でレイアウト最適化 |
| PWA マニフェスト | `public/manifest.webmanifest` | アプリ名・アイコン・standalone 表示 |
| Service Worker | `public/sw.js` | オフラインキャッシュ |
| iPhone メタタグ | `public/index.html` | apple-mobile-web-app 対応 |
| アイコン | `public/icons/icon-192.png` 等 | ホーム画面用 PNG |
| Vercel ヘッダー | `vercel.json` | SW / manifest の Content-Type |

---

## うまくいかないとき

| 症状 | 確認すること |
|---|---|
| ログインできない | Supabase の Site URL / Redirect URLs が Vercel URL と一致しているか |
| 新規登録できない | Supabase で **Enable sign ups** が ON か |
| 確認メールが届かない | Confirm email が ON の場合、迷惑メールフォルダを確認 |
| パスワード再設定が動かない | Redirect URLs に `/login/reset-password` が追加されているか |
| 真っ白な画面 | Vercel の Environment Variables が 3 つすべて設定されているか |
| ビルド失敗 | Vercel **Deployments** → 失敗したデプロイ → **Building** ログを確認 |
| PWA が追加できない | `https://` の URL で開いているか（HTTP では不可） |
| 保存が反映されない | Supabase SQL マイグレーションが実行済みか |

---

## 更新を反映するには

1. ローカルで変更をコミット → `git push origin cursor/ai-builder-web-app`
2. Vercel **Deployments** タブで新しいデプロイが自動開始される
3. **Ready** になったら iPhone で再度アクセス

---

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `vercel.json` | Vercel ビルド・PWA ヘッダー・デプロイブランチ |
| `.env.vercel.example` | Vercel 環境変数テンプレート |
| `next.config.mjs` | Next.js 設定 |
| `package.json` | 依存関係・ビルドコマンド |
| `public/manifest.webmanifest` | PWA マニフェスト |
| `public/sw.js` | Service Worker |
| `scripts/generate-pwa-icons.mjs` | PWA アイコン生成 |
