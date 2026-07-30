# AI Builder v1.0

美容機器・美容商材メーカーの **BtoB 営業担当者** 向けプロンプト生成アプリ。  
PC・iPhone・Android 対応。PWA としてホーム画面に追加できます。

## 主な機能

| 機能 | 説明 |
|---|---|
| **AI 作成ウィザード** | カテゴリ別質問フロー。選択肢タップで自動進行 |
| **AI 保存** | 生成したプロンプトを LocalStorage に自動保存 |
| **AI ライブラリ** | 保存一覧・検索・お気に入り・削除 |
| **プロンプト品質診断** | 4 軸スコア（ソリューション適合度 / 具体性 / 実用性 / BtoB 文脈） |
| **AI 評価システム** | S〜D グレード・強み / 不足情報・推奨 AI を表示 |
| **PWA** | スマホのホーム画面に追加してアプリのように利用 |

## 技術スタック

- HTML / CSS / JavaScript（フレームワークなし）
- ES Modules + LocalStorage
- PWA（Service Worker + Web App Manifest）
- Vercel / Netlify 静的ホスティング（HTTPS 自動付与）

---

## スマートフォンでの使い方（PWA）

デプロイ済みの **HTTPS URL** をスマホのブラウザで開き、ホーム画面に追加します。

### iPhone（Safari）

1. Safari でアプリの URL を開く
2. 共有ボタン（□↑）→ **ホーム画面に追加**
3. 「追加」をタップ

### Android（Chrome）

1. Chrome でアプリの URL を開く
2. メニュー（⋮）→ **ホーム画面に追加** または **アプリをインストール**
3. 指示に従って追加

---

## ローカル開発

ES Modules を使用するため、`file://` ではなく **HTTP サーバー** 経由で開いてください。

### PowerShell（Windows）

```powershell
cd C:\Users\user\ai-builder
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

ブラウザで http://localhost:8080/ を開きます。

### VS Code / Cursor（Live Server）

1. [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) をインストール
2. `index.html` を右クリック → **Open with Live Server**

### Node.js

```bash
npx serve .
```

---

## 本番デプロイ（HTTPS）

静的サイトのため **ビルド不要**。リポジトリを Vercel または Netlify に接続するだけで公開できます。

### 前提

- GitHub リポジトリ: `https://github.com/1126fs-boop/ai-builder`
- 公開ブランチ: `cursor/ai-builder-web-app`（または `main`）

---

### Vercel へのデプロイ

1. [Vercel](https://vercel.com/) にログイン
2. **Add New → Project**
3. GitHub リポジトリ `ai-builder` を Import
4. 設定（通常はデフォルトのまま）:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** （空欄）
   - **Output Directory:** `./`
5. **Deploy** をクリック
6. 完了後、`https://your-project.vercel.app` の URL が発行されます

#### CLI からデプロイする場合

```bash
npm i -g vercel
cd ai-builder
vercel
```

初回はログインとプロジェクト設定を行い、以降 `vercel --prod` で本番デプロイします。

`vercel.json` により Service Worker と Manifest のヘッダーが設定されます。

---

### Netlify へのデプロイ

1. [Netlify](https://www.netlify.com/) にログイン
2. **Add new site → Import an existing project**
3. GitHub リポジトリ `ai-builder` を接続
4. 設定:
   - **Branch to deploy:** `cursor/ai-builder-web-app`
   - **Build command:** （空欄）
   - **Publish directory:** `.`（ルート）
5. **Deploy site** をクリック
6. 完了後、`https://random-name.netlify.app` の URL が発行されます

#### CLI からデプロイする場合

```bash
npm i -g netlify-cli
cd ai-builder
netlify login
netlify init
netlify deploy --prod
```

`netlify.toml` によりヘッダーと公開設定が適用されます。

---

### デプロイ後の確認チェックリスト

- [ ] HTTPS URL でアプリが表示される
- [ ] 「＋ 新しい AI を作る」→ ウィザードに遷移する
- [ ] スマホでボタン・入力欄がタップしやすい
- [ ] iPhone / Android で「ホーム画面に追加」が表示される
- [ ] オフライン時もキャッシュ済み画面が表示される（PWA）

---

## プロジェクト構成

```
ai-builder/
├── index.html
├── style.css
├── manifest.webmanifest   # PWA マニフェスト
├── sw.js                  # Service Worker
├── vercel.json            # Vercel 設定
├── netlify.toml           # Netlify 設定
├── serve.ps1              # ローカル開発サーバー
├── icons/
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── context.js
├── categories.js
├── questions.js
├── promptBuilder.js
├── qualityEngine.js
├── wamProducts.js
├── wamImageContext.js
└── js/
    ├── app.js
    ├── pwa.js             # Service Worker 登録
    ├── state.js
    ├── ui.js
    ├── storage.js
    ├── homeView.js
    ├── questionView.js
    └── resultView.js
```

## カテゴリ

営業 / 提案書 / メルマガ / 研修 / SNS / 販促・POP / エージェント / 分析 / その他

## 設計方針

- **ソリューション営業**: 取引先の経営課題解決を起点にプロンプトを設計
- **マルチデバイス**: レスポンシブ + タッチ操作最適化 + PWA
- **HTTPS 必須**: Service Worker / ホーム画面追加は HTTPS 環境でのみ有効

## ライセンス

Private — 1126fs-boop/ai-builder
