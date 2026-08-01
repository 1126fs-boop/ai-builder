/**
 * 提案書作成 — Question Schema（Blueprint v1）
 */

import { CLIENT_INDUSTRY_OPTIONS } from "../../../context.js";

/** @type {import("./types.js").SchemaQuestion[]} */
export const PROPOSAL_SEED_QUESTIONS = [
  {
    id: "industry",
    text: "取引先の業種は？",
    type: "choice",
    options: CLIENT_INDUSTRY_OPTIONS.filter((o) => o !== "その他"),
    hint: "商談先のサロン・クリニックの業種を選んでください",
    qualityImpact: "critical",
  },
  {
    id: "client_challenge",
    text: "解決したい経営課題は？",
    type: "choice",
    options: [
      "売上アップ",
      "集客改善",
      "客単価アップ",
      "リピート率向上",
      "業務効率化",
      "スタッフ育成・採用",
    ],
    hint: "ソリューション提案の起点になる経営課題です",
    qualityImpact: "critical",
  },
];

/** 動的質問の定義（id → 質問本体） */
export const PROPOSAL_DYNAMIC_QUESTIONS = {
  proposal_scope: {
    id: "proposal_scope",
    text: "提案の種類は？",
    type: "choice",
    options: [
      "ソリューション提案書（初回）",
      "プレゼン資料（商談用）",
      "経営改善提案（課題起点）",
      "導入計画書（既存客向け）",
      "見積付き提案",
    ],
    hint: "提出形式に合わせて構成を最適化します",
    qualityImpact: "critical",
  },
  product_area: {
    id: "product_area",
    text: "提案する領域は？",
    type: "choice",
    options: [
      "美容機器",
      "痩身・フェイシャル機器",
      "化粧品・店販",
      "経営支援・教育",
      "複合提案",
    ],
    hint: "商品カタログではなく、経営改善の文脈で提案します",
    qualityImpact: "high",
  },
  client_context: {
    id: "client_context",
    text: "取引先の状況（任意）",
    type: "text",
    placeholder: "例: スタッフ5名、月商300万、リピート率が課題、競合に○○を検討中 など",
    optional: true,
    hint: "入力すると提案書の具体性が大きく向上します",
    qualityImpact: "high",
  },
  hearing_notes: {
    id: "hearing_notes",
    text: "ヒアリングで分かったこと（任意）",
    type: "text",
    placeholder: "例: オーナーは数字に弱い、スタッフの技術差に悩んでいる など",
    optional: true,
    hint: "商談メモがあれば貼り付けてください",
    qualityImpact: "medium",
  },
};

/** @type {import("./types.js").DynamicRule[]} */
export const PROPOSAL_DYNAMIC_RULES = [
  {
    questionId: "proposal_scope",
    priority: 100,
    when: (a) => !a.proposal_scope?.trim(),
    reason: "提案書の種類が未定だと構成・トーンを最適化できない",
  },
  {
    questionId: "product_area",
    priority: 90,
    when: (a) => !a.product_area?.trim(),
    reason: "提案領域が不明だと提案ストーリーが弱くなる",
  },
  {
    questionId: "client_context",
    priority: 70,
    when: (a) => !a.client_context?.trim(),
    reason: "取引先の具体状況がないとBefore/Afterが抽象的になる",
  },
  {
    questionId: "hearing_notes",
    priority: 50,
    when: (a) => !a.hearing_notes?.trim() && !a.client_context?.trim(),
    reason: "ヒアリング情報がないと本音・懸念の深掘りが不足する",
  },
];

/** @type {import("./types.js").UseCaseSchema} */
export const PROPOSAL_DOC_SCHEMA = {
  useCaseId: "proposal_doc",
  categoryId: "proposal",
  label: "提案書作成",
  seedQuestions: PROPOSAL_SEED_QUESTIONS,
  dynamicQuestions: PROPOSAL_DYNAMIC_QUESTIONS,
  dynamicRules: PROPOSAL_DYNAMIC_RULES,
  maxDynamicQuestions: 3,
  inferDefaults(answers) {
    const scope = answers.proposal_scope || "ソリューション提案書（初回）";
    const inferred = {
      output_format: scope.includes("プレゼン") ? "スライド構成" : "提案書全文",
      tone: scope.includes("既存") ? "信頼・継続関係" : "説得力重視",
    };
    if (!answers.product_area?.trim()) {
      if (answers.client_challenge === "スタッフ育成・採用") inferred.product_area = "経営支援・教育";
      else if (answers.client_challenge === "客単価アップ") inferred.product_area = "化粧品・店販";
    }
    return inferred;
  },
  estimateQuality(answers, pending) {
    let s = 0.4;
    if (answers.industry) s += 0.15;
    if (answers.client_challenge) s += 0.15;
    if (answers.proposal_scope) s += 0.15;
    if (answers.product_area) s += 0.1;
    if (answers.client_context?.trim()) s += 0.15;
    if (answers.hearing_notes?.trim()) s += 0.1;
    s -= pending * 0.05;
    return Math.min(1, Math.max(0, Math.round(s * 100) / 100));
  },
};
