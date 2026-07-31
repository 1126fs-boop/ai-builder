/**
 * Question Schema — レジストリ & ギャップ分析
 */

import { PROPOSAL_DOC_SCHEMA, PROPOSAL_DYNAMIC_QUESTIONS } from "./proposalDoc.js";

/** @type {Map<string, import("./types.js").UseCaseSchema>} */
const SCHEMAS = new Map([
  ["proposal", PROPOSAL_DOC_SCHEMA],
  ["proposal_doc", PROPOSAL_DOC_SCHEMA],
]);

/** カテゴリ ID から Schema を取得 */
export function getSchemaForCategory(categoryId) {
  return SCHEMAS.get(categoryId) || null;
}

/** Schema 対応カテゴリか */
export function hasSchemaFlow(categoryId) {
  return SCHEMAS.has(categoryId);
}

/**
 * 不足情報分析 — Dynamic 質問を決定
 * @param {string} categoryId
 * @param {Object} answers
 * @returns {import("./types.js").GapAnalysisResult}
 */
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

  const inferredAnswers = inferDefaults(schema, answers);
  const merged = { ...inferredAnswers, ...answers };

  const candidates = schema.dynamicRules
    .filter((rule) => rule.when(merged))
    .sort((a, b) => b.priority - a.priority);

  const followUpQuestions = [];
  for (const rule of candidates) {
    if (followUpQuestions.length >= schema.maxDynamicQuestions) break;
    const q = PROPOSAL_DYNAMIC_QUESTIONS[rule.questionId];
    if (q && !merged[q.id]?.trim()) {
      followUpQuestions.push({ ...q, _reason: rule.reason });
    }
  }

  const missingCritical = schema.seedQuestions
    .filter((q) => !q.optional && !merged[q.id]?.trim())
    .map((q) => q.text);

  const qualityScore = estimateQualityScore(merged, followUpQuestions.length);

  return {
    followUpQuestions,
    inferredAnswers,
    canGenerate: missingCritical.length === 0,
    qualityScore,
    missingCritical,
  };
}

/** 推論補完（ユーザーに聞かない項目） */
function inferDefaults(schema, answers) {
  if (schema.useCaseId !== "proposal_doc") return {};

  const scope = answers.proposal_scope || "ソリューション提案書（初回）";
  const inferred = {
    output_format: scope.includes("プレゼン") ? "スライド構成" : "提案書全文",
    tone: scope.includes("既存") ? "信頼・継続関係" : "説得力重視",
    ai_role: "美容業界BtoB提案書のプロフェッショナル",
  };

  if (!answers.product_area?.trim()) {
    if (answers.client_challenge === "スタッフ育成・採用") {
      inferred.product_area = "経営支援・教育";
    } else if (answers.client_challenge === "客単価アップ") {
      inferred.product_area = "化粧品・店販";
    }
  }

  return inferred;
}

/** 品質見積もり 0〜1 */
function estimateQualityScore(answers, pendingDynamicCount) {
  let score = 0.4;
  if (answers.industry) score += 0.15;
  if (answers.client_challenge) score += 0.15;
  if (answers.proposal_scope) score += 0.15;
  if (answers.product_area) score += 0.1;
  if (answers.client_context?.trim()) score += 0.15;
  if (answers.hearing_notes?.trim()) score += 0.1;
  score -= pendingDynamicCount * 0.05;
  return Math.min(1, Math.max(0, Math.round(score * 100) / 100));
}

/** Seed 質問一覧 */
export function getSeedQuestions(categoryId) {
  return getSchemaForCategory(categoryId)?.seedQuestions || [];
}
