/**
 * POP・販促物 — Question Schema
 */

import { getProductChoiceOptions } from "../../../wamProducts.js";

export const POP_PROMO_DYNAMIC_QUESTIONS = {
  appeal_point: {
    id: "appeal_point",
    text: "一番訴求したいことは？",
    type: "choice",
    options: ["売上アップ", "新メニュー", "導入メリット", "キャンペーン", "リピート率向上"],
    qualityImpact: "critical",
  },
  display_location: {
    id: "display_location",
    text: "掲示・使用場所は？",
    type: "choice",
    options: ["サロン店内", "クリニック受付", "展示会ブース", "デジタル配信（SNS等）"],
    qualityImpact: "high",
  },
  size_format: {
    id: "size_format",
    text: "サイズ・形式（任意）",
    type: "choice",
    options: ["A4縦", "A3横", "1:1（SNS）", "9:16（縦長）"],
    optional: true,
    qualityImpact: "medium",
  },
};

/** @type {import("./types.js").UseCaseSchema} */
export const POP_PROMO_SCHEMA = {
  useCaseId: "pop_promo",
  categoryId: "image",
  label: "POP・販促物",
  seedQuestions: [
    {
      id: "wam_product",
      text: "対象商品（公式HP掲載）",
      type: "choice",
      options: getProductChoiceOptions(),
      hint: "公式HP記載内容のみ参照。創作禁止",
      qualityImpact: "critical",
    },
    {
      id: "usage",
      text: "用途は？",
      type: "choice",
      options: ["店内POP", "提案資料用ビジュアル", "SNS投稿画像", "セミナー・展示会用"],
      qualityImpact: "critical",
    },
  ],
  dynamicQuestions: POP_PROMO_DYNAMIC_QUESTIONS,
  dynamicRules: [
    {
      questionId: "appeal_point",
      priority: 100,
      when: (a) => !a.appeal_point?.trim(),
      reason: "訴求軸不明だとコピーが弱い",
    },
    {
      questionId: "display_location",
      priority: 90,
      when: (a) => !a.display_location?.trim(),
      reason: "掲示場所でレイアウトと文字量が変わる",
    },
    {
      questionId: "size_format",
      priority: 50,
      when: (a) => !a.size_format?.trim(),
      reason: "サイズ指定があるとデザイン指示が具体化する",
    },
  ],
  maxDynamicQuestions: 3,
  inferDefaults(answers) {
    const usage = answers.usage || "店内POP";
    const sizeMap = {
      店内POP: "A4縦",
      提案資料用ビジュアル: "A4横",
      SNS投稿画像: "1:1（1080×1080）",
      "セミナー・展示会用": "A3横",
    };
    return {
      size_format: answers.size_format || sizeMap[usage] || "A4縦",
      style: "高級感・信頼感（ワムブランド準拠）",
      output_format: usage.includes("SNS")
        ? "画像生成プロンプト（英語）+キャッチコピー"
        : "POP文案+レイアウト指示+画像プロンプト",
    };
  },
  estimateQuality(answers, pending) {
    let s = 0.35;
    if (answers.wam_product) s += 0.2;
    if (answers.usage) s += 0.15;
    if (answers.appeal_point) s += 0.15;
    if (answers.display_location) s += 0.15;
    if (answers.size_format) s += 0.1;
    s -= pending * 0.05;
    return Math.min(1, Math.max(0, Math.round(s * 100) / 100));
  },
};
