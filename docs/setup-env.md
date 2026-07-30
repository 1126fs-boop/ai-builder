# 環境変数の設定手順

メールアドレスのみのログインには **Publishable key** と **Reference ID** だけで十分です。  
**Project URL は Reference ID から自動生成** されます（Supabase 新UI対応）。  
**`SUPABASE_SERVICE_ROLE_KEY`（Service Role Key）は不要** です。

---

## 必要な環境変数

| 変数名 | 用途 | 公開してよい？ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | ✅ はい |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key（`sb_publishable_...`） | ✅ はい |
| `NEXT_PUBLIC_APP_URL` | 本番アプリ URL（Supabase Site URL と一致） | ✅ はい |

`NEXT_PUBLIC_SUPABASE_PROJECT_REF` だけ設定しても URL は自動生成されますが、**Vercel では `NEXT_PUBLIC_SUPABASE_URL` を明示設定するのが確実**です。

設定確認 API: デプロイ後に `https://あなたのアプリ.vercel.app/api/auth/check-config` を開くと、不足している変数と Supabase に登録すべき URL が表示されます。

---

## 最短手順（自動設定）

### 1. Publishable key を `.env.local` に貼り付け

Supabase → **Connect** → **API Keys** → **Publishable key**（`sb_publishable_...`）

### 2. Reference ID を確認

Supabase → **Settings** → **General** → **Reference ID**

またはブラウザの URL:

```
https://supabase.com/dashboard/project/【ここが Reference ID】/...
```

### 3. 自動生成コマンドを実行

```powershell
cd c:\Users\user\ai-builder
npm run setup:env -- 【Reference ID】
```

ダッシュボード URL をそのまま貼り付けても OK:

```powershell
npm run setup:env -- https://supabase.com/dashboard/project/abcdefghijklmnop
```

### 4. 確認して起動

```powershell
npm run check:env
npm run dev
```

http://localhost:3000/login でメールアドレスを入力してログイン。

---

## Access Token で完全自動（任意）

Reference ID を手入力したくない場合:

1. Supabase → **Account** → **Access Tokens** でトークンを作成
2. `.env.local` に追加（GitHub には push しない）:

```env
SUPABASE_ACCESS_TOKEN=your-access-token
```

3. `npm run setup:env` を実行（引数なし）→ Reference ID を自動検出

---

## Supabase 側の設定

**Authentication → Providers → Email**:

| 設定 | 値 |
|---|---|
| Enable Email provider | ON |
| Enable sign ups | ON |
| Confirm email | **OFF**（すぐ使えるように） |

**Authentication → URL Configuration**:

| 項目 | 値 |
|---|---|
| **Site URL** | `NEXT_PUBLIC_APP_URL` と同じ（例: `https://ai-builder-xxxx.vercel.app`） |
| **Redirect URLs** | 下記をすべて追加 |

```
http://localhost:3000/auth/callback
http://localhost:3000/login
https://あなたのアプリ.vercel.app/auth/callback
https://あなたのアプリ.vercel.app/login
```

※ 実際の値は `/api/auth/check-config` の `supabaseAuth` を参照してください。

---

## Vercel（本番）

**Settings → Environment Variables** に以下を追加:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://【Reference ID】.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key（`sb_publishable_...`） |
| `NEXT_PUBLIC_APP_URL` | `https://あなたのアプリ.vercel.app` |

設定後 **Redeploy**（環境変数はビルド時に埋め込まれるため必須）。

---

## うまくいかないとき

| 症状 | 対処 |
|---|---|
| 「読み込み中…」のまま止まる | Vercel の 3 環境変数を設定 → **Redeploy**。`/api/auth/check-config` で確認 |
| ログインできない | Supabase で **Enable sign ups** が ON か確認 |
| 環境変数エラー | `npm run check:env` → `npm run setup:env -- <Reference ID>` |
| Project URL が分からない | Settings → API の Project URL、または Reference ID から `https://{ref}.supabase.co` |
| 別端末で登録済み | 確認メールのリンクを1回クリック |
