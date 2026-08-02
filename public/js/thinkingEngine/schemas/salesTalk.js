/**
 * 営業トーク — Question Schema
 */

import { CLIENT_INDUSTRY_OPTIONS } from "../../../context.js";
import { applyFreeInputQualityBonus } from "./_sharedSchemaFields.js";

export const SALES_TALK_DYNAMIC_QUESTIONS = {
  industry: {
    id: "industry",
    text: "取引先の業種は？",
    type: "choice",
    options: CLIENT_INDUSTRY_OPTIONS.filter((o) => o !== "その他"),
    qualityImpact: "critical",
  },
  goal: {
    id: "goal",
    text: "今回のゴールは？",
    type: "choice",
    options: ["アポ獲得", "商談成功", "提案受注", "リピート発注", "紹介獲得"],
    qualityImpact: "high",
  },
  client_context: {
    id: "client_context",
    text: "取引先の状況（任意）",
    type: "text",
    placeholder: "例: 2回目商談 / 競合検討中 / 予算感200万",
    optional: true,
    qualityImpact: "high",
  },
};

/** @type {import("./types.js").UseCaseSchema} */
export const SALES_TALK_SCHEMA = {
  useCaseId: "sales_talk",
  categoryId: "sales",
  label: "営業トーク",
  seedQuestions: [
    {
      id: "sales_type",
      text: "営業アクションは？",
      type: "choice",
      options: ["商談", "テレアポ", "DM", "LINE", "新規開拓", "既存フォロー"],
      hint: "場面に合った台本構成を設計します",
      qualityImpact: "critical",
    },
    {
      id: "client_challenge",
      text: "お客様の経営課題は？",
      type: "choice",
      options: [
        "売上アップ",
        "集客改善",
        "客単価アップ",
        "リピート率向上",
        "業務効率化",
        "スタッフ育成・採用",
      ],
      qualityImpact: "critical",
    },
  ],
  dynamicQuestions: SALES_TALK_DYNAMIC_QUESTIONS,
  dynamicRules: [
    {
      questionId: "industry",
      priority: 100,
      when: (a) => !a.industry?.trim(),
      reason: "業種不明だと共感トークが弱くなる",
    },
    {
      questionId: "goal",
      priority: 90,
      when: (a) => !a.goal?.trim(),
      reason: "ゴール不明だとクロージングが設計できない",
    },
    {
      questionId: "client_context",
      priority: 60,
      when: (a) => !a.client_context?.trim(),
      reason: "取引先状況があると台本の具体性が上がる",
    },
  ],
  maxDynamicQuestions: 4,
  minimumQualityScore: 0.6,
  qualityRequiredFields: ["sales_type", "client_challenge", "industry", "goal"],
  inferDefaults(answers) {
    const type = answers.sales_type || "商談";
    const formatMap = {
      商談: "商談台本（30分）",
      テレアポ: "テレアポ台本（3分）",
      DM: "DM文案（140〜300字）",
      LINE: "LINE文案",
      新規開拓: "初回接触台本",
      既存フォロー: "フォロー台本",
    };
    const toneMap = {
      新規開拓: "親しみやすい・信頼構築",
      商談: "論理的・説得力",
      テレアポ: "簡潔・課題共感",
    };
    return {
      output_format: formatMap[type] || "営業台本",
      tone: toneMap[type] || "プロフェッショナル",
    };
  },
  estimateQuality(answers, pending) {
    let s = 0.3;
    if (answers.sales_type) s += 0.15;
    if (answers.client_challenge) s += 0.15;
    if (answers.industry) s += 0.15;
    if (answers.goal) s += 0.15;
    if (answers.client_context?.trim()) s += 0.12;
    s -= pending * 0.04;
    return applyFreeInputQualityBonus(Math.min(1, Math.max(0, Math.round(s * 100) / 100)), answers);
  },
};
