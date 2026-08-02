/**
 * カテゴリ別 Knowledge Base レジストリ
 *
 * 各カテゴリ専用KBを統合参照。thinkingCore / Blueprint / Prompt Builder 共通。
 */

import { buildSnsCategoryBlock, SNS_CATEGORY_KB } from "./categories/snsKnowledge.js";
import { buildNewsletterCategoryBlock, NEWSLETTER_CATEGORY_KB } from "./categories/newsletterKnowledge.js";
import { buildProposalCategoryBlock, PROPOSAL_CATEGORY_KB } from "./categories/proposalKnowledge.js";
import { buildSalesCategoryBlock, SALES_CATEGORY_KB } from "./categories/salesKnowledge.js";
import { buildImageCategoryBlock, IMAGE_CATEGORY_KB } from "./categories/imageKnowledge.js";

/** @type {Record<string, Object>} */
export const CATEGORY_KB_META = {
  sns: SNS_CATEGORY_KB,
  newsletter: NEWSLETTER_CATEGORY_KB,
  proposal: PROPOSAL_CATEGORY_KB,
  sales: SALES_CATEGORY_KB,
  image: IMAGE_CATEGORY_KB,
};

const BLOCK_BUILDERS = {
  sns: buildSnsCategoryBlock,
  newsletter: buildNewsletterCategoryBlock,
  proposal: buildProposalCategoryBlock,
  sales: buildSalesCategoryBlock,
  image: buildImageCategoryBlock,
};

/**
 * カテゴリ専用KBメタを取得
 * @param {string} categoryId
 */
export function getCategoryKnowledgeMeta(categoryId) {
  return CATEGORY_KB_META[categoryId] ?? null;
}

/**
 * Prompt Builder 向け — カテゴリ専用KBブロック
 * @param {string} categoryId
 * @param {Object} [context]
 */
export function buildCategoryKnowledgeBlock(categoryId, context = {}) {
  const builder = BLOCK_BUILDERS[categoryId];
  if (!builder) return "";
  return builder(context);
}

/**
 * AnalysisContext 用 — カテゴリKBスナップショット
 * @param {string} categoryId
 * @param {Object} [answers]
 */
export function buildCategoryKnowledgeSnapshot(categoryId, answers = {}) {
  const meta = getCategoryKnowledgeMeta(categoryId);
  if (!meta) return null;

  return {
    categoryId,
    label: meta.label,
    version: meta.version,
    principles: meta.principles ?? [],
    block: buildCategoryKnowledgeBlock(categoryId, {
      appealAxis: answers.appeal_axis,
      salesType: answers.sales_type,
      displayLocation: answers.display_location,
      surfaceChallenge: answers.client_challenge,
    }),
  };
}
