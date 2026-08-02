/**
 * Knowledge Registry — 美容業界ナレッジの参照・拡張
 *
 * 静的ドメイン知識 + 会社ルール + 将来の学習ナレッジを統合参照する。
 */

import {
  BASE_RULES,
  CHALLENGE_IMPACT,
  INDUSTRY_CONTEXT,
  DEFAULT_THINKING_PROCESS,
} from "../../domainKnowledge.js";
import { resolveProductFromAnswers, getProductImageMode } from "../../../../wamProducts.js";
import { WAM_IMAGE_GENERATION_RULES } from "../../../../wamImageContext.js";
import { WAM_BRAND_RULES } from "./wamKnowledgeBase.js";
import { LEARNED_KNOWLEDGE_ENABLED } from "./knowledgeTypes.js";
import { generatePersistableId } from "../types/persistable.js";

/** 会社独自ルール（WAM KB + 拡張ポイント） */
const COMPANY_RULES = [...WAM_BRAND_RULES];

/** 営業ノウハウ（拡張可能） */
const SALES_KNOW_HOW = [
  "共感→ヒアリング→提案→CTA の順で構成する",
  "CTA は1つに絞り、明日から実行できる粒度にする",
  "架空の数字・店舗名は【】プレースホルダーで明示する",
];

/** 将来: DB / Supabase から読み込む学習ナレッジ */
/** @type {import("./knowledgeTypes.js").KnowledgeItem[]} */
const learnedItems = [];

/** 実行時に追加登録されるカスタムナレッジ */
/** @type {import("./knowledgeTypes.js").KnowledgeItem[]} */
const runtimeItems = [];

/**
 * ナレッジを実行時登録（将来: 管理画面・学習パイプラインから呼ぶ）
 * @param {import("./knowledgeTypes.js").KnowledgeItem} item
 */
export function registerKnowledgeItem(item) {
  runtimeItems.push({
    id: item.id ?? generatePersistableId("kn"),
    ...item,
  });
}

/**
 * 会社ルールを追加
 * @param {string} rule
 */
export function registerCompanyRule(rule) {
  registerKnowledgeItem({
    layer: "company",
    key: `rule_${runtimeItems.length}`,
    value: rule,
    source: "runtime",
    priority: 50,
  });
}

/** 訴求軸 → 経営課題マッピング（SNS/POP 等） */
export const APPEAL_TO_CHALLENGE = {
  売上アップ: "売上アップ",
  リピート率向上: "リピート率向上",
  導入メリット: "業務効率化",
  新商品告知: "客単価アップ",
  成功事例: "売上アップ",
  新メニュー: "客単価アップ",
  キャンペーン: "集客改善",
};

/** 配信目的 → 経営課題マッピング */
export const PURPOSE_TO_CHALLENGE = {
  "新商品・新機器のご案内": "客単価アップ",
  "経営ノウハウ提供": "売上アップ",
  "セミナー・説明会案内": "集客改善",
  "フォロー・関係強化": "リピート率向上",
};

/**
 * 分析用ナレッジスナップショットを構築
 * @param {string} categoryId
 * @param {Object} answers
 * @param {import("../types/analysisContext.js").ChallengeAnalysis} challenge
 */
export function buildKnowledgeSnapshot(categoryId, answers, challenge) {
  const industry = challenge?.industry || answers.industry || "美容サロン";
  const surfaceChallenge = challenge?.surfaceChallenge || answers.client_challenge;

  const industryFacts = [];
  if (INDUSTRY_CONTEXT[industry]) {
    industryFacts.push(`${industry}: ${INDUSTRY_CONTEXT[industry]}`);
  }
  if (surfaceChallenge && CHALLENGE_IMPACT[surfaceChallenge]) {
    industryFacts.push(
      `${surfaceChallenge}の期待インパクト: ${CHALLENGE_IMPACT[surfaceChallenge]}`
    );
  }

  const challengePatterns = [];
  if (surfaceChallenge) {
    challengePatterns.push(`${surfaceChallenge}改善の典型: 小さく始めてPoCで検証`);
  }

  let productKnowledge = null;
  const product = resolveProductFromAnswers(answers);
  if (product) {
    productKnowledge = {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      officialUrl: product.officialUrl,
      officialImageUrl: product.officialImageUrl,
      imageMode: getProductImageMode(product),
    };
  }

  const antiPatterns = [...BASE_RULES];
  if (categoryId === "sns" || categoryId === "image") {
    antiPatterns.push(...WAM_IMAGE_GENERATION_RULES.slice(0, 4));
    antiPatterns.push("公式HPのレイアウト・配色・タイポグラフィをデザインテンプレートとして使わない");
  }

  const refs = runtimeItems.map((item) => item.id);
  if (LEARNED_KNOWLEDGE_ENABLED) {
    refs.push(...learnedItems.map((item) => item.id));
  }

  return {
    industryFacts,
    challengePatterns,
    productKnowledge,
    salesPrinciples: [...SALES_KNOW_HOW, DEFAULT_THINKING_PROCESS.split("\n")[0]],
    antiPatterns,
    companyRules: [
      ...COMPANY_RULES,
      ...runtimeItems.filter((i) => i.layer === "company").map((i) => String(i.value)),
    ],
    refs,
  };
}

/** 登録済みナレッジ一覧（デバッグ・将来管理UI用） */
export function listKnowledgeItems() {
  return [...runtimeItems, ...(LEARNED_KNOWLEDGE_ENABLED ? learnedItems : [])];
}
