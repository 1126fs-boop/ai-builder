/**
 * Question Schema — レジストリ & ギャップ分析
 */

import { PROPOSAL_DOC_SCHEMA } from "./proposalDoc.js";
import { SNS_IMAGE_SCHEMA } from "./snsImage.js";
import { NEWSLETTER_LINE_SCHEMA } from "./newsletterLine.js";
import { SALES_TALK_SCHEMA } from "./salesTalk.js";
import { POP_PROMO_SCHEMA } from "./popPromo.js";
import { runWizardAnalysis } from "../core/pipeline/analysisPipeline.js";
import { emptyGapAnalysis } from "../core/analyzers/gapAnalyzer.js";

/** @type {Map<string, import("./types.js").UseCaseSchema>} */
const SCHEMAS = new Map([
  ["proposal", PROPOSAL_DOC_SCHEMA],
  ["proposal_doc", PROPOSAL_DOC_SCHEMA],
  ["sns", SNS_IMAGE_SCHEMA],
  ["sns_image", SNS_IMAGE_SCHEMA],
  ["newsletter", NEWSLETTER_LINE_SCHEMA],
  ["newsletter_line", NEWSLETTER_LINE_SCHEMA],
  ["sales", SALES_TALK_SCHEMA],
  ["sales_talk", SALES_TALK_SCHEMA],
  ["image", POP_PROMO_SCHEMA],
  ["pop_promo", POP_PROMO_SCHEMA],
]);

export function getSchemaForCategory(categoryId) {
  return SCHEMAS.get(categoryId) || null;
}

export function hasSchemaFlow(categoryId) {
  return SCHEMAS.has(categoryId);
}

/**
 * 不足情報分析 — thinkingCore フェーズ1〜3 経由
 * @param {string} categoryId
 * @param {Object} answers
 */
export function runGapAnalysis(categoryId, answers) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) return emptyGapAnalysis();

  const { gap } = runWizardAnalysis(categoryId, answers);
  return gap;
}

export function getSeedQuestions(categoryId) {
  return getSchemaForCategory(categoryId)?.seedQuestions || [];
}

/** Blueprint 対応カテゴリ一覧 */
export function getDeliverableCategoryIds() {
  return [...new Set([...SCHEMAS.values()].map((s) => s.categoryId))];
}
