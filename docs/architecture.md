# Architecture — システム構成

## 全体像

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────────┐  │
│  │  Views   │  │  State   │  │  LocalStorage        │  │
│  │ home     │  │  state.js│  │  (0.x 保存)          │  │
│  │ question │  └──────────┘  └─────────────────────┘  │
│  │ result   │                                           │
│  └────┬─────┘                                           │
│       │                                                 │
│  ┌────▼────────────────────────────────────────────┐   │
│  │              Application Layer (js/)              │   │
│  │  app.js → homeView / questionView / resultView  │   │
│  └────┬────────────────────────────────────────────┘   │
│       │                                                 │
│  ┌────▼────────────────────────────────────────────┐   │
│  │              Domain Layer (root)                  │   │
│  │  categories.js  questions.js  promptBuilder.js   │   │
│  │  context.js                                       │   │
│  └────┬────────────────────────────────────────────┘   │
└───────┼─────────────────────────────────────────────────┘
        │  (1.0〜)
┌───────▼─────────────────────────────────────────────────┐
│                    Backend API (1.0)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Auth API │  │ Save API │  │  AI Proxy API         │  │
│  └──────────┘  └──────────┘  └──────────┬───────────┘  │
└─────────────────────────────────────────┼───────────────┘
                                          │
              ┌───────────────────────────┼───────────────┐
              │                           │               │
        ┌─────▼─────┐            ┌────────▼───┐   ┌──────▼──────┐
        │  OpenAI   │            │   Claude   │   │   Gemini    │
        │  API      │            │   API      │   │   API       │
        └───────────┘            └────────────┘   └─────────────┘
```

---

## 現行構成（Version 0.3）

### ディレクトリ構造

```
ai-builder/
├── index.html              # エントリ HTML（3画面）
├── style.css               # グローバルスタイル
├── context.js              # プロジェクト共通前提（BtoB・ソリューション営業）
├── categories.js           # カテゴリメタデータ
├── questions.js            # 質問データ（カテゴリ ID → 質問配列）
├── promptBuilder.js        # プロンプト生成 + 品質チェック
├── js/
│   ├── app.js              # エントリポイント・イベント接続
│   ├── state.js            # アプリ状態
│   ├── ui.js               # DOM 参照・ビュー切替・トースト
│   ├── storage.js          # LocalStorage CRUD
│   ├── homeView.js         # ホーム画面
│   ├── questionView.js     # 質問フロー
│   └── resultView.js       # 結果画面
└── docs/                   # 設計ドキュメント
```

### レイヤー責務

| レイヤー | ファイル | 責務 |
|---|---|---|
| **Context** | `context.js` | 会社前提・ソリューション営業原則。全プロンプトに適用 |
| **Domain** | `categories.js` | カテゴリ定義（id, label, icon, popular） |
| **Domain** | `questions.js` | 質問定義（type, options, placeholder） |
| **Domain** | `promptBuilder.js` | 回答 → プロンプト変換、品質チェック |
| **Application** | `js/*View.js` | 画面描画・ユーザー操作 |
| **Infrastructure** | `js/storage.js` | 永続化（現: LocalStorage） |
| **Presentation** | `index.html`, `style.css` | UI 構造・スタイル |

---

## データフロー

```
[ユーザー] → カテゴリ選択
    ↓
[state.js] categoryId 設定
    ↓
[questionView] questions.js から質問を1問ずつ表示
    ↓
[state.js] answers に回答蓄積（戻っても保持）
    ↓
[resultView] promptBuilder.buildPrompt(categoryId, answers)
    ↓
[context.js] wrapPrompt() で BtoB 前提を付与
    ↓
[storage.js] LocalStorage に保存
    ↓
[resultView] プロンプト表示 + 品質スコア + コピー
```

---

## 1.0 以降の構成（計画）

### Backend API

```
/api
├── /auth
│   POST /login
│   POST /logout
│   GET  /me
├── /prompts
│   GET    /           # 一覧
│   POST   /           # 作成
│   GET    /:id        # 詳細
│   PUT    /:id        # 更新
│   DELETE /:id        # 削除
├── /favorites
│   POST   /:promptId  # お気に入り toggle
└── /ai
    POST   /execute    # AI 実行（プロキシ）
    GET    /providers  # 利用可能プロバイダー一覧
```

### AI プロバイダー抽象化（0.8〜）

```javascript
// ai/providers/base.js
class AIProvider {
  optimizePrompt(prompt) { /* プロバイダー別最適化 */ }
  async execute(prompt, options) { /* API 実行 */ }
}

// ai/providers/openai.js
// ai/providers/claude.js
// ai/providers/gemini.js

// ai/providerFactory.js
function getProvider(name) { /* ファクトリ */ }
```

### マルチ AI プロンプト最適化方針

| プロバイダー | 最適化方針 |
|---|---|
| **OpenAI (GPT-4o)** | システムメッセージ + 構造化出力。Function Calling 対応 |
| **Claude (Sonnet)** | XML タグ構造。長文コンテキスト向け `<context>` ブロック |
| **Gemini** | マルチモーダル指示。JSON schema 出力対応 |

---

## 技術選定

| 領域 | 現行 (0.x) | 1.0 計画 |
|---|---|---|
| フロント | Vanilla JS (ES Module) | 同左 + PWA |
| スタイル | CSS 変数 + BEM 風 | 同左 + デザインシステム |
| 保存 | LocalStorage | Backend API + DB |
| 認証 | なし | JWT |
| AI 連携 | なし（コピー運用） | Backend プロキシ |
| ホスティング | 静的ファイル | Vercel / Cloudflare Pages + API |
| DB | — | PostgreSQL or Supabase |

---

## 拡張ポイント

新カテゴリ追加時に触るファイル:

```
1. categories.js  → 1エントリ追加
2. questions.js   → 質問配列追加
3. promptBuilder.js → ビルダー関数追加
```

**触らないファイル**: `js/*View.js`（自動反映）

---

## セキュリティアーキテクチャ（1.0）

- API キーは **Backend のみ** で保持（クライアントに露出しない）
- ユーザー認証: JWT（HttpOnly Cookie）
- CORS: 本番ドメインのみ許可
- Rate Limiting: AI 実行 API に適用

---

*最終更新: 2026-07-30*
