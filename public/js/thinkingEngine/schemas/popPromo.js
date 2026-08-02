/**
 * POP・販促物 — Question Schema
 */

import { getProductChoiceOptions } from "../../../wamProducts.js";
import { applyFreeInputQualityBonus } from "./_sharedSchemaFields.js";

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
    qualityImpact: "critical",
  },
  catch_direction: {
    id: "catch_direction",
    text: "キャッチコピーの方向性",
    type: "text",
    placeholder: "例: 数字で効果訴求 / 高級感 / 来店促進",
    optional: true,
    hint: "ヘッドラインの精度が上がります",
    qualityImpact: "high",
  },
  size_format: {
    id: "size_format",
    text: "サイズ・形式",
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
      reason: "訴求軸不明だとコピーが弱くなります",
    },
    {
      questionId: "display_location",
      priority: 95,
      when: (a) => !a.display_location?.trim(),
      reason: "掲示場所でレイアウトと文字量が変わります",
    },
    {
      questionId: "catch_direction",
      priority: 80,
      when: (a) => !a.catch_direction?.trim(),
      reason: "キャッチ方向があるとヘッドライン精度が上がります",
    },
    {
      questionId: "size_format",
      priority: 50,
      when: (a) => !a.size_format?.trim(),
      reason: "サイズ指定があるとデザイン指示が具体化します",
    },
  ],
  maxDynamicQuestions: 4,
  minimumQualityScore: 0.65,
  qualityRequiredFields: ["wam_product", "usage", "appeal_point", "display_location"],
  inferDefaults(answers) {
    const usage = answers.usage || "店内POP";
    const sizeMap = {
      店内POP: "A4縦",
      提案資料用ビジュアル: "A4横",
      SNS投稿画像: "1:1（1080×1080）",
      "セミナー・展示会用": "A3横",
    };
    const locationMap = {
      店内POP: "サロン店内",
      提案資料用ビジュアル: "クリニック受付",
      SNS投稿画像: "デジタル配信（SNS等）",
      "セミナー・展示会用": "展示会ブース",
    };
    const appealMap = {
      店内POP: "キャンペーン",
      提案資料用ビジュアル: "導入メリット",
      SNS投稿画像: "導入メリット",
      "セミナー・展示会用": "導入メリット",
    };
    return {
      display_location: answers.display_location || locationMap[usage] || "サロン店内",
      appeal_point: answers.appeal_point || appealMap[usage] || "導入メリット",
      size_format: answers.size_format || sizeMap[usage] || "A4縦",
      style: "高級感・信頼感（ワムブランド準拠）",
      output_format: usage.includes("SNS")
        ? "画像生成プロンプト（英語）+キャッチコピー"
        : "POP文案+レイアウト指示+画像プロンプト",
    };
  },
  estimateQuality(answers, pending) {
    let s = 0.3;
    if (answers.wam_product) s += 0.2;
    if (answers.usage) s += 0.15;
    if (answers.appeal_point) s += 0.15;
    if (answers.display_location) s += 0.15;
    if (answers.catch_direction?.trim()) s += 0.1;
    if (answers.size_format) s += 0.05;
    s -= pending * 0.04;
    return applyFreeInputQualityBonus(Math.min(1, Math.max(0, Math.round(s * 100) / 100)), answers);
  },
};
