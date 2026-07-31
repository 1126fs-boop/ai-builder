/**
 * Question Schema — レジストリ & ギャップ分析
 */

import { PROPOSAL_DOC_SCHEMA } from "./proposalDoc.js";
import { SNS_IMAGE_SCHEMA } from "./snsImage.js";
import { NEWSLETTER_LINE_SCHEMA } from "./newsletterLine.js";
import { SALES_TALK_SCHEMA } from "./salesTalk.js";
import { POP_PROMO_SCHEMA } from "./popPromo.js";

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

export function runGapAnalysis(categoryId, answers) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) {
    return {
      followUpQuestions: [],
      inferredAnswers: {},
      canGenerate: true,
      qualityScore: 0.5,
      missingCritical: [],
    };
  }

  const inferredAnswers = schema.inferDefaults?.(answers) || {};
  const merged = { ...inferredAnswers, ...answers };

  const candidates = schema.dynamicRules
    .filter((rule) => rule.when(merged))
    .sort((a, b) => b.priority - a.priority);

  const followUpQuestions = [];
  for (const rule of candidates) {
    if (followUpQuestions.length >= schema.maxDynamicQuestions) break;
    const q = schema.dynamicQuestions?.[rule.questionId];
    if (q && !merged[q.id]?.trim()) {
      followUpQuestions.push({ ...q, _reason: rule.reason });
    }
  }

  const missingCritical = schema.seedQuestions
    .filter((q) => !q.optional && !merged[q.id]?.trim())
    .map((q) => q.text);

  const qualityScore = schema.estimateQuality
    ? schema.estimateQuality(merged, followUpQuestions.length)
    : 0.5;

  return {
    followUpQuestions,
    inferredAnswers,
    canGenerate: missingCritical.length === 0,
    qualityScore,
    missingCritical,
  };
}

export function getSeedQuestions(categoryId) {
  return getSchemaForCategory(categoryId)?.seedQuestions || [];
}

/** Blueprint 対応カテゴリ一覧 */
export function getDeliverableCategoryIds() {
  return [...new Set([...SCHEMAS.values()].map((s) => s.categoryId))];
}
