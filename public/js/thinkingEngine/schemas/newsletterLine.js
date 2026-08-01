/**
 * メルマガ・LINE配信 — Question Schema
 */

/** @type {import("./types.js").SchemaQuestion[]} */
const SEED = [
  {
    id: "channel",
    text: "配信チャネルは？",
    type: "choice",
    options: ["メルマガ（メール）", "LINE配信", "メルマガ＋LINE両方"],
    hint: "形式に合わせて文体と長さを最適化します",
    qualityImpact: "critical",
  },
  {
    id: "purpose",
    text: "配信の目的は？",
    type: "choice",
    options: ["新商品・新機器のご案内", "経営ノウハウ提供", "セミナー・説明会案内", "フォロー・関係強化"],
    hint: "目的で件名・CTAの設計が変わります",
    qualityImpact: "critical",
  },
];

export const NEWSLETTER_LINE_DYNAMIC_QUESTIONS = {
  audience: {
    id: "audience",
    text: "配信先は？",
    type: "choice",
    options: ["新規見込み客", "既存取引先", "VIP取引先", "休眠取引先"],
    hint: "相手に合ったトーンと訴求を設計します",
    qualityImpact: "critical",
  },
  value: {
    id: "value",
    text: "提供する価値は？",
    type: "choice",
    options: ["売上アップ施策", "集客アイデア", "客単価アップ", "業務効率化", "スタッフ教育"],
    qualityImpact: "high",
  },
  product_topic: {
    id: "product_topic",
    text: "訴求商品・テーマ（任意）",
    type: "text",
    placeholder: "例: ハイパーナイフEX2 / 春のキャンペーン",
    optional: true,
    qualityImpact: "medium",
  },
};

/** @type {import("./types.js").UseCaseSchema} */
export const NEWSLETTER_LINE_SCHEMA = {
  useCaseId: "newsletter_line",
  categoryId: "newsletter",
  label: "メルマガ・LINE配信",
  seedQuestions: SEED,
  dynamicQuestions: NEWSLETTER_LINE_DYNAMIC_QUESTIONS,
  dynamicRules: [
    {
      questionId: "audience",
      priority: 100,
      when: (a) => !a.audience?.trim(),
      reason: "配信先不明だとトーンとCTAが最適化できない",
    },
    {
      questionId: "value",
      priority: 90,
      when: (a) => !a.value?.trim(),
      reason: "提供価値がないと開封・読了率が下がる",
    },
    {
      questionId: "product_topic",
      priority: 60,
      when: (a) => !a.product_topic?.trim() && (a.purpose || "").includes("新商品"),
      reason: "新商品案内では商品名・テーマが必要",
    },
  ],
  maxDynamicQuestions: 3,
  inferDefaults(answers) {
    const toneMap = {
      新規見込み客: "ビジネスライク・信頼構築",
      既存取引先: "親しみやすい・継続関係",
      VIP取引先: "特別感・限定感",
      休眠取引先: "再接触・共感から",
    };
    const ch = answers.channel || "";
    return {
      tone: toneMap[answers.audience] || "プロフェッショナル",
      output_format: ch.includes("LINE") && !ch.includes("メルマガ")
        ? "LINE短文（300字以内）"
        : ch.includes("両方")
          ? "メール件名3+本文 + LINE短文"
          : "件名3パターン + 本文",
    };
  },
  estimateQuality(answers, pending) {
    let s = 0.35;
    if (answers.channel) s += 0.15;
    if (answers.purpose) s += 0.15;
    if (answers.audience) s += 0.15;
    if (answers.value) s += 0.15;
    if (answers.product_topic?.trim()) s += 0.1;
    s -= pending * 0.05;
    return Math.min(1, Math.max(0, Math.round(s * 100) / 100));
  },
};
