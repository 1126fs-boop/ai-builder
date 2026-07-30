/**
 * AI Builder — 質問データ
 *
 * 美容業界 BtoB メーカー営業向け。
 * カテゴリ ID → 質問配列の Record 構造。
 */

import { CLIENT_INDUSTRY_OPTIONS } from "./context.js";

/** @typedef {"choice"|"choice_with_custom"|"text"} QuestionType */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} text
 * @property {QuestionType} type
 * @property {string[]} [options]
 * @property {string} [placeholder]
 * @property {boolean} [optional]
 */

/** @type {Record<string, Question[]>} */
export const QUESTIONS = {

  /* ── 営業（8問） ── */
  sales: [
    {
      id: "sales_type",
      text: "営業種別",
      type: "choice",
      options: ["新規開拓", "既存フォロー", "テレアポ", "商談", "DM", "LINE"],
    },
    {
      id: "industry",
      text: "取引先の業種",
      type: "choice",
      options: CLIENT_INDUSTRY_OPTIONS,
    },
    {
      id: "client_challenge",
      text: "お客様の経営課題",
      type: "choice",
      options: [
        "売上アップ",
        "集客改善",
        "客単価アップ",
        "リピート率向上",
        "業務効率化",
        "スタッフ育成・採用",
        "メニュー強化",
      ],
    },
    {
      id: "goal",
      text: "今回の営業目的",
      type: "choice",
      options: ["アポ獲得", "商談成功", "提案受注", "リピート発注", "紹介獲得"],
    },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: [
        "美容機器メーカーのトップ営業",
        "美容業界20年以上の経営コンサル",
        "BtoBソリューション営業のプロ",
        "コピーライター",
        "自由入力",
      ],
      placeholder: "AIの役割を自由に入力してください",
    },
    {
      id: "tone",
      text: "文章トーン",
      type: "choice",
      options: ["論理的", "親しみやすい", "熱量高め", "AIっぽくない", "高級感"],
    },
    {
      id: "output_format",
      text: "出力形式",
      type: "choice",
      options: ["営業台本", "DM文案", "LINE文案", "メール文案", "箇条書き", "表"],
    },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "取引先名、提案商品、ヒアリング内容、競合状況など",
      optional: true,
    },
  ],

  /* ── 提案書 ── */
  proposal: [
    {
      id: "industry",
      text: "取引先の業種",
      type: "choice",
      options: CLIENT_INDUSTRY_OPTIONS,
    },
    {
      id: "client_challenge",
      text: "解決する経営課題",
      type: "choice",
      options: ["売上アップ", "集客改善", "客単価アップ", "リピート率向上", "業務効率化", "スタッフ育成"],
    },
    {
      id: "proposal_type",
      text: "提案書の種類",
      type: "choice",
      options: ["ソリューション提案書", "プレゼン資料", "見積提案", "導入計画書", "経営改善提案"],
    },
    {
      id: "product_area",
      text: "提案する領域",
      type: "choice",
      options: ["美容機器", "痩身・フェイシャル機器", "化粧品・店販", "経営支援・教育", "複合提案"],
    },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: ["BtoB提案書のプロ", "美容業界コンサルタント", "経営改善アドバイザー", "自由入力"],
      placeholder: "AIの役割を自由に入力",
    },
    {
      id: "tone",
      text: "文体・トーン",
      type: "choice",
      options: ["プロフェッショナル", "説得力重視", "データドリブン", "ストーリー調"],
    },
    {
      id: "output_format",
      text: "出力形式",
      type: "choice",
      options: ["スライド構成", "提案書全文", "エグゼクティブサマリー", "Before/After形式"],
    },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "取引先の状況、提案商品、予算感、導入時期など",
      optional: true,
    },
  ],

  /* ── メルマガ ── */
  newsletter: [
    {
      id: "industry",
      text: "配信先の業種",
      type: "choice",
      options: CLIENT_INDUSTRY_OPTIONS,
    },
    {
      id: "purpose",
      text: "配信目的",
      type: "choice",
      options: ["新商品・新機器のご案内", "経営ノウハウ提供", "セミナー・説明会案内", "フォロー・関係強化"],
    },
    {
      id: "audience",
      text: "配信先",
      type: "choice",
      options: ["新規見込み客", "既存取引先", "VIP取引先", "休眠取引先"],
    },
    {
      id: "value",
      text: "提供する価値",
      type: "choice",
      options: ["売上アップ施策", "集客アイデア", "客単価アップ", "業務効率化", "スタッフ教育"],
    },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: ["BtoBメールマーケター", "美容業界コンサル", "コピーライター", "自由入力"],
      placeholder: "AIの役割を自由に入力",
    },
    { id: "tone", text: "文体・トーン", type: "choice", options: ["ビジネスライク", "親しみやすい", "専門的", "コンサル調"] },
    { id: "output_format", text: "出力形式", type: "choice", options: ["件名+本文", "ステップメール", "箇条書き", "HTMLメール"] },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "配信商品、キャンペーン、ターゲットの課題など",
      optional: true,
    },
  ],

  /* ── 教育・ロープレ ── */
  training: [
    {
      id: "training_type",
      text: "資料の種類",
      type: "choice",
      options: ["営業ロープレ", "商談シミュレーション", "スタッフ教育", "商品研修", "ソリューション営業研修"],
    },
    {
      id: "industry",
      text: "想定する取引先業種",
      type: "choice",
      options: CLIENT_INDUSTRY_OPTIONS,
    },
    {
      id: "scenario",
      text: "シナリオ",
      type: "choice",
      options: ["新規開拓", "既存への追加提案", "競合からの切替", "経営課題ヒアリング", "クロージング"],
    },
    {
      id: "skill_focus",
      text: "鍛えるスキル",
      type: "choice",
      options: ["ヒアリング力", "提案力", "反論処理", "クロージング", "ソリューション提案"],
    },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: ["営業研修のプロトレーナー", "美容業界ベテラン営業", "ロープレ相手（お客様役）", "自由入力"],
      placeholder: "AIの役割を自由に入力",
    },
    { id: "tone", text: "トーン", type: "choice", options: ["実践的", "厳しめ", "サポート型", "リアルな現場再現"] },
    { id: "output_format", text: "出力形式", type: "choice", options: ["ロープレ台本", "研修資料", "Q&A想定", "チェックリスト"] },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "研修対象者レベル、想定商品、よくある反論など",
      optional: true,
    },
  ],

  /* ── SNS ── */
  sns: [
    {
      id: "purpose",
      text: "SNSの用途",
      type: "choice",
      options: ["取引先向け情報発信", "サロン経営ノウハウ", "商品・機器の活用事例", "セミナー・イベント告知"],
    },
    { id: "platform", text: "プラットフォーム", type: "choice", options: ["Instagram", "X（Twitter）", "LINE公式", "Facebook"] },
    {
      id: "goal",
      text: "目的",
      type: "choice",
      options: ["認知・信頼構築", "リード獲得", "既存客エンゲージメント", "導入事例の発信"],
    },
    { id: "tone", text: "トーン", type: "choice", options: ["プロフェッショナル", "親しみやすい", "専門性アピール", "事例ストーリー"] },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: ["BtoB SNSマーケター", "美容業界コンテンツライター", "自由入力"],
      placeholder: "AIの役割を自由に入力",
    },
    { id: "output_format", text: "出力形式", type: "choice", options: ["投稿文", "投稿文+ハッシュタグ", "カルーセル構成", "ストーリー台本"] },
    { id: "frequency", text: "ボリューム", type: "choice", options: ["1投稿", "3投稿セット", "1週間分"] },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "訴求商品、ターゲットサロン、事例内容など",
      optional: true,
    },
  ],

  /* ── 販促・POP ── */
  image: [
    {
      id: "usage",
      text: "用途",
      type: "choice",
      options: ["店内POP", "提案資料用ビジュアル", "SNS投稿画像", "セミナー・展示会用"],
    },
    {
      id: "target",
      text: "掲示・使用場所",
      type: "choice",
      options: ["サロン店内", "クリニック受付", "展示会ブース", "デジタル配信"],
    },
    { id: "message", text: "訴求メッセージ", type: "choice", options: ["売上アップ", "新メニュー", "キャンペーン", "導入メリット"] },
    { id: "style", text: "スタイル", type: "choice", options: ["高級感", "ナチュラル", "モダン", "温かみ"] },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: ["美容業界アートディレクター", "販促デザイナー", "自由入力"],
      placeholder: "AIの役割を自由に入力",
    },
    { id: "output_format", text: "出力形式", type: "choice", options: ["画像生成プロンプト（英語）", "コピー+構成案", "POP文案+レイアウト指示"] },
    { id: "aspect", text: "サイズ・比率", type: "choice", options: ["A4縦", "A3横", "1:1（SNS）", "9:16（ストーリー）"] },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "商品名、キャッチコピー案、ブランドカラーなど",
      optional: true,
    },
  ],

  /* ── AIエージェント ── */
  agent: [
    {
      id: "role",
      text: "エージェントの用途",
      type: "choice",
      options: ["商談ロープレ相手", "提案書作成支援", "ヒアリング設計", "反論処理トレーナー"],
    },
    {
      id: "industry",
      text: "想定取引先業種",
      type: "choice",
      options: CLIENT_INDUSTRY_OPTIONS,
    },
    {
      id: "user",
      text: "利用者",
      type: "choice",
      options: ["営業担当者", "営業マネージャー", "新入社員", "代理店パートナー"],
    },
    {
      id: "feature",
      text: "主要機能",
      type: "choice",
      options: ["ロープレ対話", "提案ドラフト生成", "ヒアリング質問生成", "競合分析支援"],
    },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: ["お客様（サロンオーナー）役", "営業コーチ", "美容業界コンサル", "自由入力"],
      placeholder: "AIの役割を自由に入力",
    },
    { id: "tone", text: "応答トーン", type: "choice", options: ["リアルなお客様", "厳しい商談相手", "サポート型コーチ", "プロフェッショナル"] },
    { id: "output_format", text: "出力形式", type: "choice", options: ["システムプロンプト", "対話シナリオ", "評価チェックリスト"] },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "想定シナリオ、よくある反論、提案商品など",
      optional: true,
    },
  ],

  /* ── 分析 ── */
  analysis: [
    {
      id: "target",
      text: "分析対象",
      type: "choice",
      options: ["取引先サロンの経営状況", "競合メーカー", "エリア市場", "導入事例データ"],
    },
    {
      id: "purpose",
      text: "分析目的",
      type: "choice",
      options: ["提案準備", "ヒアリング設計", "課題仮説の立案", "商談前リサーチ"],
    },
    {
      id: "industry",
      text: "対象業種",
      type: "choice",
      options: CLIENT_INDUSTRY_OPTIONS,
    },
    {
      id: "framework",
      text: "分析フレームワーク",
      type: "choice",
      options: ["経営課題マップ", "SWOT", "3C分析", "カスタマージャーニー"],
    },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: ["美容業界アナリスト", "BtoB営業ストラテジスト", "自由入力"],
      placeholder: "AIの役割を自由に入力",
    },
    { id: "output_format", text: "出力形式", type: "choice", options: ["箇条書き", "提案準備シート", "ヒアリング質問リスト", "レポート"] },
    { id: "depth", text: "分析の深さ", type: "choice", options: ["概要（5分）", "標準（15分）", "詳細（30分）"] },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "取引先名、エリア、既知の課題、競合情報など",
      optional: true,
    },
  ],

  /* ── その他 ── */
  other: [
    {
      id: "purpose",
      text: "用途",
      type: "choice",
      options: ["メール文案", "社内資料", "代理店向け資料", "その他カスタム"],
    },
    {
      id: "industry",
      text: "関連する業種",
      type: "choice",
      options: CLIENT_INDUSTRY_OPTIONS,
    },
    {
      id: "client_challenge",
      text: "関連する経営課題",
      type: "choice",
      options: ["売上アップ", "集客", "客単価", "リピート", "業務効率", "該当なし"],
    },
    { id: "output_size", text: "期待する出力", type: "choice", options: ["短い（1〜2段落）", "中程度（500字）", "長文（1000字以上）", "リスト形式"] },
    {
      id: "ai_role",
      text: "AIの役割",
      type: "choice_with_custom",
      options: ["BtoB営業のプロ", "美容業界コンサル", "コピーライター", "自由入力"],
      placeholder: "AIの役割を自由に入力",
    },
    { id: "tone", text: "文体・トーン", type: "choice", options: ["フォーマル", "親しみやすい", "専門的", "説得的"] },
    { id: "output_format", text: "出力形式", type: "choice", options: ["箇条書き", "文章", "表", "ステップ形式"] },
    {
      id: "extra_info",
      text: "追加情報",
      type: "text",
      placeholder: "具体的な要件や背景を入力",
      optional: true,
    },
  ],
};

/** @param {string} categoryId @returns {Question[]} */
export function getQuestions(categoryId) {
  return QUESTIONS[categoryId] || [];
}

/** @param {string} categoryId @returns {number} */
export function getQuestionCount(categoryId) {
  return getQuestions(categoryId).length;
}
