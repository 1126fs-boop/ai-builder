# AI Builder v1.0

美容機器・美容商材メーカーの **BtoB 営業担当者** 向けプロンプト生成アプリ。  
質問に答えるだけで、ソリューション営業に最適化された AI プロンプトを生成します。

## 主な機能

| 機能 | 説明 |
|---|---|
| **AI 作成ウィザード** | カテゴリ別 8 問の質問フロー。選択肢タップで自動進行 |
| **AI 保存** | 生成したプロンプトを LocalStorage に自動保存 |
| **AI ライブラリ** | 保存一覧・検索・お気に入り・削除 |
| **プロンプト品質診断** | 4 軸スコア（ソリューション適合度 / 具体性 / 実用性 / BtoB 文脈） |
| **AI 評価システム** | S〜D グレード・強み / 不足情報・推奨 AI を表示 |

## 技術スタック

- HTML / CSS / JavaScript（フレームワークなし）
- ES Modules
- LocalStorage（`aibuilder_v1_*` キー、v0.3 から自動マイグレーション）

## 起動方法

ES Modules を使用するため、**HTTP サーバー経由**で開いてください。

### VS Code / Cursor（推奨）

1. プロジェクトフォルダを開く
2. [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 拡張をインストール
3. `index.html` を右クリック → **Open with Live Server**

### その他

```bash
# Node.js がある場合
npx serve .

# Python がある場合
python -m http.server 8080
```

ブラウザで `http://localhost:8080`（ポートは環境に合わせて変更）を開きます。

> `file://` プロトocol では ES Module の import が動作しない場合があります。

## プロジェクト構成

```
ai-builder/
├── index.html          # エントリ HTML
├── style.css           # v1.0 デザインシステム
├── context.js          # BtoB 営業共通コンテキスト
├── categories.js       # 9 カテゴリ定義
├── questions.js        # カテゴリ別質問データ
├── promptBuilder.js    # プロンプト生成ロジック
├── qualityEngine.js    # 品質診断・評価エンジン
└── js/
    ├── app.js          # エントリポイント
    ├── state.js        # アプリ状態
    ├── ui.js           # DOM / 共通 UI
    ├── storage.js      # LocalStorage 管理
    ├── homeView.js     # ホーム & ライブラリ
    ├── questionView.js # 作成ウィザード
    └── resultView.js   # 結果・保存・評価
```

## カテゴリ

営業 / 提案書 / メルマガ / 研修 / SNS / 画像 / エージェント / 分析 / その他

## 設計方針

- **ソリューション営業**: 商品押し売りではなく、取引先の経営課題解決を起点にプロンプトを設計
- **現場で使える完成度**: 生成プロンプトは ChatGPT / Claude にそのまま貼り付け可能
- **品質の可視化**: 不足情報を具体的に提示し、再生成でスコア向上を促す

## ライセンス

Private — 1126fs-boop/ai-builder
