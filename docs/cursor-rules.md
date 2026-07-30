# Cursor Rules — 開発ルール

このドキュメントは、AI Builder を Cursor で開発する際のルールです。
`.cursor/rules/` にルールとして登録することを推奨します。

---

## 1. プロジェクト前提（必ず守る）

- このアプリは **美容業界 BtoB メーカー営業専用** である
- **一般向け AI ツールではない**
- すべての機能・プロンプト・UI 文案は **ソリューション営業** 前提
- 商品押し売り・スペック説明を促す設計は **禁止**

### ソリューション営業の原則

```
✅ 経営課題を解決する
✅ 売上・利益・リピート・集客・客単価を上げる
✅ 取引先（サロンオーナー）の立場に立つ
❌ 商品説明・カタログ的な出力
❌ 汎用的すぎるプロンプト
```

---

## 2. 技術スタック

| 項目 | ルール |
|---|---|
| フロント | HTML / CSS / JavaScript **のみ** |
| フレームワーク | React / Vue / jQuery **使用禁止** |
| モジュール | ES Module（`import` / `export`） |
| ビルド | 不要（Vanilla JS を直接ブラウザ実行） |
| 起動 | Live Server 等 HTTP サーバー必須（ES Module） |

---

## 3. ファイル構成ルール

```
触っていいファイル          触るべきでないファイル
─────────────────          ─────────────────
categories.js              index.html（構造変更は要相談）
questions.js               style.css（デザインシステム）
promptBuilder.js
context.js
js/*View.js
js/app.js
js/storage.js
docs/*
```

### 新カテゴリ追加手順

```
1. categories.js  → CATEGORIES に1エントリ
2. questions.js   → QUESTIONS に質問配列
3. promptBuilder.js → PROMPT_BUILDERS に関数 + QUALITY_DATA
4. View ファイルは変更不要（自動反映）
```

---

## 4. コーディング規約

### JavaScript

- **日本語コメント** を書く（ビジネスロジック・非自明な処理）
- 1ファイル = 1責務
- グローバル変数を増やさない（`state.js` に集約）
- DOM 操作は `ui.js` の `DOM` オブジェクト経由
- データ定義と UI ロジックを **混在させない**

### CSS

- CSS 変数（`:root`）でテーマ管理
- BEM 風命名: `.block__element--modifier`
- スマホファースト（`min-width` で拡張）
- 新コンポーネントは `style.css` 末尾にセクション追加

### HTML

- セマンティック HTML（`section`, `nav`, `header`）
- `aria-*` 属性を適切に付与
- `hidden` 属性でビュー切替（display のみに依存しない）

---

## 5. プロンプト生成ルール

`promptBuilder.js` でプロンプトを追加・変更する際:

1. **必ず** `wrapPrompt()` でラップする（`context.js` の前提を付与）
2. 取引先業種（`industry`）と経営課題（`client_challenge`）を参照する
3. 「商品を売る」ではなく「課題を解く」指示を含める
4. 出力形式（`output_format`）に合わせた指示を書く
5. 営業担当者が ChatGPT に**そのまま貼り付け可能**な完成度にする

---

## 6. データ・保存ルール

- LocalStorage キーは `aibuilder_v{version}_*` 形式
- キー変更時は **マイグレーション関数** を `storage.js` に追加
- ユーザーデータを `console.log` で出力しない（本番）
- API キーをソースコードにハードコード **禁止**

---

## 7. UI/UX ルール

- デザイン参照: **Apple / ChatGPT / Linear / Notion**
- アクセントカラー: `#2563eb`
- 角丸・余白・カード型 UI を維持
- アニメーション: 200〜400ms、`cubic-bezier(0.4, 0, 0.2, 1)`
- 営業現場想定: **3タップ以内** でプロンプト完成
- エラー時はトースト通知（`showToast()`）

---

## 8. Git / コミットルール

- ブランチ prefix: `cursor/`
- コミットメッセージ: 英語、1行サマリー + 空行 + 本文
- 無関係ファイル（ZIP 等）をコミットしない
- `git config` を変更しない
- force push to main **禁止**

---

## 9. 実装の進め方

```
設計（docs/）→ データ（categories/questions/promptBuilder）→ UI（js/*View）→ スタイル
```

- **設計ファースト**: 機能追加前に `docs/features.md` を更新
- **最小 diff**: 要求された範囲のみ変更
- **既存機能を削除しない**（非破壊的変更）
- Version 番号は `index.html` の badge と `docs/roadmap.md` で管理

---

## 10. AI（Cursor）への指示テンプレート

新機能を Cursor に依頼する際のテンプレート:

```
## 前提
- 美容 BtoB メーカー営業専用 AI Builder
- ソリューション営業（商品押し売り禁止）
- HTML/CSS/JS のみ、ES Module

## やること
- [具体的な機能]

## 触るファイル
- categories.js / questions.js / promptBuilder.js / js/xxxView.js

## やらないこと
- 既存機能の削除
- フレームワーク導入
- 一般向けへの汎化
```

---

## 11. テスト方針（1.0 以降）

| 対象 | 方法 |
|---|---|
| promptBuilder | ユニットテスト（回答 → プロンプト検証） |
| storage | LocalStorage モックテスト |
| 質問フロー | E2E（Playwright） |
| プロンプト品質 | 人手レビュー + LLM 評価 |

---

*最終更新: 2026-07-30*
