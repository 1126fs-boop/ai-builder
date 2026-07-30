/**
 * AI Builder v0.2 — 質問データ
 *
 * ─────────────────────────────────────────────
 * 新しいカテゴリの追加方法
 * ─────────────────────────────────────────────
 * 1. CATEGORY_REGISTRY にキーを追加（例: myCategory）
 * 2. id / label / icon / description / questions / buildPrompt を定義
 * 3. 保存するだけで UI・フロー・プロンプト生成が自動反映されます
 *
 * 質問タイプ:
 *   - "choice"            … 選択肢から1つ選ぶ
 *   - "choice_with_custom"… 選択肢 + 「自由入力」でテキスト欄表示
 *   - "text"              … 自由入力のみ
 *
 * ─────────────────────────────────────────────
 */

/* eslint-disable no-unused-vars */

/**
 * @typedef {"choice"|"choice_with_custom"|"text"} QuestionType
 */

/**
 * @typedef {Object} Question
 * @property {string}   id          - 質問の一意ID（回答マップのキー）
 * @property {string}   text        - 画面に表示する質問文
 * @property {QuestionType} type    - 入力タイプ
 * @property {string[]} [options]    - 選択肢（choice 系で使用）
 * @property {string}   [placeholder] - テキスト入力のプレースホルダー
 * @property {boolean}  [optional]  - true なら未入力でも次へ進める
 */

/**
 * @typedef {Object} Category
 * @property {string}     id
 * @property {string}     label
 * @property {string}     icon
 * @property {string}     description
 * @property {Question[]} questions
 * @property {function(Object<string,string>): string} buildPrompt
 */

/**
 * カテゴリレジストリ
 * キー = カテゴリ ID。100カテゴリ以上に拡張可能な Map 構造。
 * @type {Record<string, Category>}
 */
const CATEGORY_REGISTRY = {

  /* ───────── 営業 ───────── */
  sales: {
    id: "sales",
    label: "営業",
    icon: "💼",
    description: "営業シーンに最適化されたプロンプト",
    questions: [
      {
        id: "sales_type",
        text: "営業種別",
        type: "choice",
        options: ["新規営業", "既存営業", "テレアポ", "商談", "DM", "LINE"],
      },
      {
        id: "industry",
        text: "業界",
        type: "choice",
        options: ["エステ", "美容室", "整体", "クリニック", "その他"],
      },
      {
        id: "position",
        text: "立場",
        type: "choice",
        options: ["メーカー", "代理店", "コンサル", "店舗"],
      },
      {
        id: "goal",
        text: "目的",
        type: "choice",
        options: ["アポ獲得", "商談成功", "売上アップ", "紹介獲得", "リピート"],
      },
      {
        id: "ai_role",
        text: "AIの役割",
        type: "choice_with_custom",
        options: [
          "世界トップ営業マン",
          "美容業界20年以上のコンサル",
          "トップマーケター",
          "コピーライター",
          "自由入力",
        ],
        placeholder: "AIの役割を自由に入力してください",
      },
      {
        id: "tone",
        text: "文章のトーン",
        type: "choice",
        options: ["論理的", "親しみやすい", "熱量高め", "AIっぽくない", "高級感"],
      },
      {
        id: "output_format",
        text: "出力形式",
        type: "choice",
        options: ["箇条書き", "表", "営業台本", "DM", "メール", "プレゼン資料"],
      },
      {
        id: "extra_info",
        text: "追加情報",
        type: "text",
        placeholder: "商品名、ターゲット、制約条件など自由に入力",
        optional: true,
      },
    ],
    buildPrompt(answers) {
      return `あなたは${answers.ai_role}として、最高品質の営業コンテンツを作成してください。

【基本情報】
- 営業種別: ${answers.sales_type}
- 業界: ${answers.industry}
- 立場: ${answers.position}
- 目的: ${answers.goal}

【出力条件】
- 文章のトーン: ${answers.tone}
- 出力形式: ${answers.output_format}
${answers.extra_info ? `- 追加情報: ${answers.extra_info}` : ""}

【品質要件】
- ${answers.industry}業界の専門用語と文脈を正確に反映する
- ${answers.tone}のトーンを一貫して維持する
- ${answers.output_format}形式で、すぐ使える完成度で出力する
- AIっぽい表現を避け、人間が書いたような自然な文章にする
- 目的（${answers.goal}）に直結するCTAを必ず含める`;
    },
  },

  /* ───────── メルマガ ───────── */
  newsletter: {
    id: "newsletter",
    label: "メルマガ",
    icon: "📧",
    description: "メールマーケティング用プロンプト",
    questions: [
      {
        id: "purpose",
        text: "配信目的",
        type: "choice",
        options: ["新商品告知", "教育・ノウハウ", "キャンペーン", "ブランド認知"],
      },
      {
        id: "audience",
        text: "ターゲット読者",
        type: "choice",
        options: ["新規登録者", "既存顧客", "VIP顧客", "見込み客"],
      },
      {
        id: "tone",
        text: "文体・トーン",
        type: "choice",
        options: ["ビジネスライク", "カジュアル", "専門的", "ストーリー調"],
      },
      {
        id: "cta",
        text: "CTA（行動喚起）",
        type: "choice",
        options: ["商品購入", "資料DL", "セミナー参加", "問い合わせ"],
      },
      {
        id: "ai_role",
        text: "AIの役割",
        type: "choice_with_custom",
        options: ["トップメールマーケター", "コピーライター", "ブランドストラテジスト", "自由入力"],
        placeholder: "AIの役割を自由に入力",
      },
      {
        id: "output_format",
        text: "出力形式",
        type: "choice",
        options: ["件名+本文", "箇条書き", "ステップメール", "HTMLメール"],
      },
      {
        id: "length",
        text: "文章量",
        type: "choice",
        options: ["短め（300字）", "標準（600字）", "長め（1000字以上）"],
      },
      {
        id: "extra_info",
        text: "追加情報",
        type: "text",
        placeholder: "商品名、キャンペーン詳細など",
        optional: true,
      },
    ],
    buildPrompt(answers) {
      return `あなたは${answers.ai_role}として、効果的なメルマガを作成してください。

【条件】
- 配信目的: ${answers.purpose}
- ターゲット: ${answers.audience}
- トーン: ${answers.tone}
- CTA: ${answers.cta}
- 出力形式: ${answers.output_format}
- 文章量: ${answers.length}
${answers.extra_info ? `- 追加情報: ${answers.extra_info}` : ""}

【出力要件】
- 件名案を3パターン提示
- スキャンしやすい構成
- CTAへの自然な誘導`;
    },
  },

  /* ───────── SNS ───────── */
  sns: {
    id: "sns",
    label: "SNS",
    icon: "📱",
    description: "SNS投稿・コンテンツ用プロンプト",
    questions: [
      {
        id: "platform",
        text: "プラットフォーム",
        type: "choice",
        options: ["X（Twitter）", "Instagram", "LinkedIn", "TikTok"],
      },
      {
        id: "post_type",
        text: "投稿タイプ",
        type: "choice",
        options: ["テキスト", "画像付き", "動画スクリプト", "スレッド"],
      },
      {
        id: "goal",
        text: "投稿目的",
        type: "choice",
        options: ["認知拡大", "商品宣伝", "専門性アピール", "エンゲージメント"],
      },
      {
        id: "tone",
        text: "トーン",
        type: "choice",
        options: ["ユーモア", "プロフェッショナル", "共感型", "挑発的"],
      },
      {
        id: "ai_role",
        text: "AIの役割",
        type: "choice_with_custom",
        options: ["SNSマーケター", "インフルエンサー", "コピーライター", "自由入力"],
        placeholder: "AIの役割を自由に入力",
      },
      {
        id: "output_format",
        text: "出力形式",
        type: "choice",
        options: ["投稿文のみ", "投稿文+ハッシュタグ", "カルーセル構成", "台本"],
      },
      {
        id: "frequency",
        text: "投稿ボリューム",
        type: "choice",
        options: ["1投稿", "3投稿セット", "1週間分", "1ヶ月分"],
      },
      {
        id: "extra_info",
        text: "追加情報",
        type: "text",
        placeholder: "ブランド名、商品、ターゲットなど",
        optional: true,
      },
    ],
    buildPrompt(answers) {
      return `あなたは${answers.ai_role}として、${answers.platform}向けのSNSコンテンツを作成してください。

【条件】
- 投稿タイプ: ${answers.post_type}
- 目的: ${answers.goal}
- トーン: ${answers.tone}
- 出力形式: ${answers.output_format}
- ボリューム: ${answers.frequency}
${answers.extra_info ? `- 追加情報: ${answers.extra_info}` : ""}

【出力要件】
- プラットフォーム特性に最適化
- エンゲージメントを高めるフック文
- ハッシュタグ案を含める`;
    },
  },

  /* ───────── 画像生成 ───────── */
  image: {
    id: "image",
    label: "画像生成",
    icon: "🎨",
    description: "AI画像生成用プロンプト",
    questions: [
      {
        id: "usage",
        text: "画像の用途",
        type: "choice",
        options: ["SNS投稿", "Webサイト", "プレゼン", "広告バナー"],
      },
      {
        id: "style",
        text: "スタイル",
        type: "choice",
        options: ["フォトリアル", "イラスト", "ミニマル", "3D"],
      },
      {
        id: "mood",
        text: "雰囲気",
        type: "choice",
        options: ["明るい", "高級感", "未来的", "ナチュラル"],
      },
      {
        id: "subject",
        text: "被写体",
        type: "choice",
        options: ["人物", "風景", "商品", "抽象"],
      },
      {
        id: "ai_role",
        text: "AIの役割",
        type: "choice_with_custom",
        options: ["プロの画像プロンプトエンジニア", "アートディレクター", "自由入力"],
        placeholder: "AIの役割を自由に入力",
      },
      {
        id: "output_format",
        text: "出力形式",
        type: "choice",
        options: ["英語プロンプトのみ", "英語+日本語訳", "プロンプト+ネガティブ"],
      },
      {
        id: "aspect",
        text: "アスペクト比",
        type: "choice",
        options: ["1:1（正方形）", "16:9（横長）", "9:16（縦長）", "4:3"],
      },
      {
        id: "extra_info",
        text: "追加情報",
        type: "text",
        placeholder: "具体的な被写体、色、構図など",
        optional: true,
      },
    ],
    buildPrompt(answers) {
      return `あなたは${answers.ai_role}として、AI画像生成用のプロンプトを作成してください。

【条件】
- 用途: ${answers.usage}
- スタイル: ${answers.style}
- 雰囲気: ${answers.mood}
- 被写体: ${answers.subject}
- 出力形式: ${answers.output_format}
- アスペクト比: ${answers.aspect}
${answers.extra_info ? `- 追加情報: ${answers.extra_info}` : ""}

【出力要件】
- 詳細で具体的な英語プロンプト
- ネガティブプロンプトも併記
- 推奨設定（Steps, CFG等）を提案`;
    },
  },

  /* ───────── AIエージェント ───────── */
  agent: {
    id: "agent",
    label: "AIエージェント",
    icon: "🤖",
    description: "AIエージェント設計用プロンプト",
    questions: [
      {
        id: "role",
        text: "エージェントの役割",
        type: "choice",
        options: ["カスタマーサポート", "リサーチ", "コーディング", "コンテンツ作成"],
      },
      {
        id: "user",
        text: "対象ユーザー",
        type: "choice",
        options: ["一般消費者", "社内メンバー", "開発者", "経営者"],
      },
      {
        id: "feature",
        text: "主要機能",
        type: "choice",
        options: ["Q&A", "タスク自動実行", "データ分析", "マルチステップ推論"],
      },
      {
        id: "constraint",
        text: "制約・ルール",
        type: "choice",
        options: ["正確性重視", "簡潔さ重視", "創造性重視", "セキュリティ重視"],
      },
      {
        id: "ai_role",
        text: "AIの役割",
        type: "choice_with_custom",
        options: ["AIエージェント設計の専門家", "プロンプトエンジニア", "自由入力"],
        placeholder: "AIの役割を自由に入力",
      },
      {
        id: "output_format",
        text: "出力形式",
        type: "choice",
        options: ["システムプロンプト", "フル設計書", "YAML設定", "JSON設定"],
      },
      {
        id: "tone",
        text: "応答トーン",
        type: "choice",
        options: ["フォーマル", "フレンドリー", "技術的", "カスタム"],
      },
      {
        id: "extra_info",
        text: "追加情報",
        type: "text",
        placeholder: "連携サービス、禁止事項など",
        optional: true,
      },
    ],
    buildPrompt(answers) {
      return `あなたは${answers.ai_role}として、AIエージェントのシステムプロンプトを設計してください。

【条件】
- 役割: ${answers.role}
- 対象ユーザー: ${answers.user}
- 主要機能: ${answers.feature}
- 制約: ${answers.constraint}
- 出力形式: ${answers.output_format}
- 応答トーン: ${answers.tone}
${answers.extra_info ? `- 追加情報: ${answers.extra_info}` : ""}

【出力要件】
- ペルソナと行動原則を定義
- 対応可能/不可タスクを明示
- エラーハンドリングルール`;
    },
  },

  /* ───────── 分析 ───────── */
  analysis: {
    id: "analysis",
    label: "分析",
    icon: "📊",
    description: "データ分析・リサーチ用プロンプト",
    questions: [
      {
        id: "target",
        text: "分析対象",
        type: "choice",
        options: ["売上・財務", "ユーザー行動", "競合・市場", "テキスト・口コミ"],
      },
      {
        id: "purpose",
        text: "分析目的",
        type: "choice",
        options: ["課題特定", "トレンド把握", "意思決定支援", "レポート作成"],
      },
      {
        id: "output_format",
        text: "出力形式",
        type: "choice",
        options: ["箇条書き", "詳細レポート", "グラフ付き", "アクションリスト"],
      },
      {
        id: "depth",
        text: "分析の深さ",
        type: "choice",
        options: ["概要（5分）", "標準（15分）", "詳細（30分）", "エグゼクティブ1枚"],
      },
      {
        id: "ai_role",
        text: "AIの役割",
        type: "choice_with_custom",
        options: ["データサイエンティスト", "ビジネスアナリスト", "マーケットリサーチャー", "自由入力"],
        placeholder: "AIの役割を自由に入力",
      },
      {
        id: "tone",
        text: "報告トーン",
        type: "choice",
        options: ["客観的・データドriven", "ストーリー調", "エグゼクティブ向け", "技術者向け"],
      },
      {
        id: "framework",
        text: "分析フレームワーク",
        type: "choice",
        options: ["SWOT", "PEST", "ファネル分析", "カスタム"],
      },
      {
        id: "extra_info",
        text: "追加情報",
        type: "text",
        placeholder: "分析したいデータ、期間、仮説など",
        optional: true,
      },
    ],
    buildPrompt(answers) {
      return `あなたは${answers.ai_role}として、分析プロンプトを作成してください。

【条件】
- 分析対象: ${answers.target}
- 目的: ${answers.purpose}
- 出力形式: ${answers.output_format}
- 深さ: ${answers.depth}
- フレームワーク: ${answers.framework}
- トーン: ${answers.tone}
${answers.extra_info ? `- 追加情報: ${answers.extra_info}` : ""}

【出力要件】
- 分析フレームワークと観点を明示
- 必要データ項目のリスト
- ステップバイステップの手順`;
    },
  },

  /* ───────── その他 ───────── */
  other: {
    id: "other",
    label: "その他",
    icon: "✨",
    description: "カスタム用途のプロンプト",
    questions: [
      {
        id: "purpose",
        text: "用途・目的",
        type: "choice",
        options: ["ビジネス文書", "クリエイティブ", "学習・教育", "日常・個人"],
      },
      {
        id: "output_size",
        text: "期待する出力",
        type: "choice",
        options: ["短い（1〜2段落）", "中程度（500字）", "長文（1000字以上）", "リスト形式"],
      },
      {
        id: "tone",
        text: "文体・トーン",
        type: "choice",
        options: ["フォーマル", "カジュアル", "専門的", "創造的"],
      },
      {
        id: "priority",
        text: "重視する点",
        type: "choice",
        options: ["正確性", "創造性", "簡潔さ", "網羅性"],
      },
      {
        id: "ai_role",
        text: "AIの役割",
        type: "choice_with_custom",
        options: ["プロフェッショナル", "専門コンサルタント", "クリエイター", "自由入力"],
        placeholder: "AIの役割を自由に入力",
      },
      {
        id: "output_format",
        text: "出力形式",
        type: "choice",
        options: ["箇条書き", "文章", "表", "ステップ形式"],
      },
      {
        id: "language",
        text: "言語",
        type: "choice",
        options: ["日本語", "英語", "日英両方"],
      },
      {
        id: "extra_info",
        text: "追加情報",
        type: "text",
        placeholder: "具体的な要件や背景を入力",
        optional: true,
      },
    ],
    buildPrompt(answers) {
      return `あなたは${answers.ai_role}として、最適なAIプロンプトを作成してください。

【条件】
- 用途: ${answers.purpose}
- 出力サイズ: ${answers.output_size}
- トーン: ${answers.tone}
- 重視: ${answers.priority}
- 出力形式: ${answers.output_format}
- 言語: ${answers.language}
${answers.extra_info ? `- 追加情報: ${answers.extra_info}` : ""}

【出力要件】
- 明確な役割定義
- 具体的なタスク指示
- 出力フォーマット指定`;
    },
  },
};

/* ───────── 品質チェック（ダミーデータ） ───────── */

/**
 * カテゴリ別の品質チェックダミーデータ
 * 将来 API 連携に差し替え可能
 * @type {Record<string, { score: number, stars: number, missing: string[] }>}
 */
const QUALITY_CHECK_DATA = {
  sales: {
    score: 85,
    stars: 5,
    missing: ["ターゲット顧客の詳細属性", "競合他社との差別化ポイント"],
  },
  newsletter: {
    score: 82,
    stars: 4,
    missing: ["ブランドガイドライン", "過去の配信実績データ"],
  },
  sns: {
    score: 80,
    stars: 4,
    missing: ["ブランドカラー・ビジュアル規定", "過去の高エンゲージメント投稿例"],
  },
  image: {
    score: 78,
    stars: 4,
    missing: ["参照画像の指定", "ブランドカラーパレット"],
  },
  agent: {
    score: 83,
    stars: 4,
    missing: ["既存ツール連携仕様", "エスカレーション条件の詳細"],
  },
  analysis: {
    score: 81,
    stars: 4,
    missing: ["生データのサンプル", "比較対象期間の指定"],
  },
  other: {
    score: 75,
    stars: 4,
    missing: ["具体的なユースケース", "期待する成果物のサンプル"],
  },
};

/* ───────── 公開 API（グローバル） ───────── */

/**
 * script.js から参照するデータアクセス層
 */
const AIBuilderData = {

  /**
   * 全カテゴリを配列で返す（ホーム画面の描画用）
   * @returns {Category[]}
   */
  getCategories() {
    return Object.values(CATEGORY_REGISTRY);
  },

  /**
   * ID からカテゴリを取得
   * @param {string} id
   * @returns {Category|undefined}
   */
  getCategory(id) {
    return CATEGORY_REGISTRY[id];
  },

  /**
   * 品質チェックデータを取得（ダミー）
   * @param {string} categoryId
   * @returns {{ score: number, stars: number, missing: string[] }}
   */
  getQualityCheck(categoryId) {
    return QUALITY_CHECK_DATA[categoryId] || {
      score: 75,
      stars: 4,
      missing: ["詳細な背景情報", "具体的な成果指標"],
    };
  },
};
