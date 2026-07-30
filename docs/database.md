# Database — データ設計

## 概要

| フェーズ | 保存方式 | スコープ |
|---|---|---|
| **0.x（現行）** | LocalStorage | 端末ローカルのみ |
| **1.0** | Backend + RDB | ユーザー単位でクラウド同期 |
| **2.0** | RDB + 外部 CRM | 取引先データ連携 |

---

## 0.x — LocalStorage スキーマ（現行）

### `aibuilder_v3_saved` — 保存プロンプト

```typescript
interface SavedPrompt {
  id: string;              // "sp_{timestamp}_{random}"
  title: string;           // 自動生成 or ユーザー入力
  category: string;        // カテゴリ ID（sales, proposal 等）
  categoryLabel: string;   // 表示用ラベル（営業, 提案書 等）
  datetime: string;        // ISO 8601
  prompt: string;          // 完成プロンプト全文
}
```

**例**

```json
{
  "id": "sp_1722345678_abc123",
  "title": "営業 — エステサロン — 売上アップ",
  "category": "sales",
  "categoryLabel": "営業",
  "datetime": "2026-07-30T04:30:00.000Z",
  "prompt": "あなたは美容機器メーカーの..."
}
```

---

### `aibuilder_v3_favorites` — お気に入り

```typescript
type FavoriteIds = string[];  // SavedPrompt.id の配列（新しい順）
```

---

### `aibuilder_v3_recent` — 最近使ったカテゴリ

```typescript
type RecentCategoryIds = string[];  // カテゴリ ID（最大8件、新しい順）
```

---

## 1.0 — RDB スキーマ（計画）

### ER 図（概念）

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  users   │────<│   prompts    │>────│  categories  │
└──────────┘     └──────────────┘     └──────────────┘
      │                 │
      │                 │
      ▼                 ▼
┌──────────┐     ┌──────────────┐
│ favorites│     │   answers    │
└──────────┘     └──────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ ai_executions│
                 └──────────────┘
```

---

### `users` — ユーザー

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| email | VARCHAR(255) UNIQUE | ログイン ID |
| name | VARCHAR(100) | 表示名 |
| role | ENUM | `sales` / `manager` / `admin` |
| team_id | UUID FK | 所属チーム |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `categories` — カテゴリ（マスタ）

| カラム | 型 | 説明 |
|---|---|---|
| id | VARCHAR(50) PK | `sales`, `proposal` 等 |
| label | VARCHAR(100) | 表示名 |
| icon | VARCHAR(10) | 絵文字 |
| description | TEXT | |
| popular | BOOLEAN | 人気フラグ |
| sort_order | INT | 表示順 |
| is_active | BOOLEAN | 有効 / 無効 |

---

### `prompts` — 保存プロンプト

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | 作成者 |
| category_id | VARCHAR(50) FK | |
| title | VARCHAR(200) | |
| prompt_text | TEXT | 完成プロンプト |
| quality_score | INT NULL | AI 品質スコア |
| is_shared | BOOLEAN | チーム共有フラグ |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `answers` — 質問回答（プロンプト生成時）

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| prompt_id | UUID FK → prompts | |
| question_id | VARCHAR(50) | 質問 ID |
| answer_text | TEXT | 回答内容 |

**用途**: プロンプト再生成・分析・テンプレート改善

---

### `favorites` — お気に入り

| カラム | 型 | 説明 |
|---|---|---|
| user_id | UUID FK | |
| prompt_id | UUID FK | |
| created_at | TIMESTAMP | |

**PK**: `(user_id, prompt_id)`

---

### `ai_executions` — AI 実行履歴（0.8〜）

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| prompt_id | UUID FK NULL | 元プロンプト |
| provider | ENUM | `openai` / `claude` / `gemini` |
| model | VARCHAR(100) | `gpt-4o`, `claude-sonnet-4` 等 |
| input_tokens | INT | |
| output_tokens | INT | |
| result_text | TEXT | AI 出力 |
| created_at | TIMESTAMP | |

---

### `clients` — 取引先（2.0 構想）

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK | |
| name | VARCHAR(200) | サロン名 |
| industry | ENUM | エステ / 美容室 / クリニック 等 |
| challenge | TEXT NULL | 主要経営課題 |
| notes | TEXT NULL | メモ |
| created_at | TIMESTAMP | |

**用途**: 取引先ごとに AI プロンプトを紐付け、CRM 連携

---

## データ移行計画

### LocalStorage → Backend（1.0）

```
1. 初回ログイン時に LocalStorage の prompts を API へ POST
2. 移行完了後 LocalStorage キーに migrated フラグ
3. 以降は API を正とする
```

---

## インデックス設計（1.0）

| テーブル | インデックス | 用途 |
|---|---|---|
| prompts | `(user_id, created_at DESC)` | ユーザーの一覧 |
| prompts | `(category_id)` | カテゴリ別 |
| favorites | `(user_id)` | お気に入り取得 |
| ai_executions | `(user_id, created_at DESC)` | 実行履歴 |

---

## 保持ポリシー

| データ | 保持期間 |
|---|---|
| 保存プロンプト | 無期限（ユーザー削除まで） |
| AI 実行履歴 | 90日（1.0） |
| ログ | 30日 |

---

*最終更新: 2026-07-30*
