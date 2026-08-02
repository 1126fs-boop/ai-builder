/**
 * フェーズ3 — 不足情報判定（Dynamic 質問決定）
 *
 * KB 補完済みフィールドは再質問しない。本当に必要な項目だけ聞く。
 */

import { isKbEnrichedField } from "./inputEnricher.js";

/**
 * @param {string} categoryId
 * @param {Object} answers
 * @param {import("../../schemas/types.js").UseCaseSchema} schema
 * @param {import("../types/analysisContext.js").PurposeAnalysis} purpose
 * @param {import("../types/analysisContext.js").ChallengeAnalysis} challenge
 * @param {{ enrichedFields?: string[], enrichmentSources?: Object[], enrichmentConfidence?: number }} [options]
 * @returns {import("../types/analysisContext.js").GapAnalysis}
 */
export function analyzeGaps(categoryId, answers, schema, purpose, challenge, options = {}) {
  const enrichmentSources = options.enrichmentSources ?? [];
  const enrichmentConfidence = options.enrichmentConfidence ?? 0;

  const inferredAnswers = schema.inferDefaults?.(answers) || {};
  const merged = { ...inferredAnswers, ...answers };

  const candidates = schema.dynamicRules
    .filter((rule) => rule.when(merged))
    .sort((a, b) => b.priority - a.priority);

  const followUpQuestions = [];
  for (const rule of candidates) {
    if (followUpQuestions.length >= schema.maxDynamicQuestions) break;
    const q = schema.dynamicQuestions?.[rule.questionId];
    if (!q) continue;

    const alreadyFilled = Boolean(merged[q.id]?.trim());
    if (alreadyFilled) continue;

    // KB 補完済み → 再質問しない（任意項目 or 高信頼度の補完）
    if (isKbEnrichedField(q.id, enrichmentSources, 0.68)) continue;
    if (q.optional && enrichmentConfidence >= 0.65) continue;
    if (q.qualityImpact === "medium" && enrichmentConfidence >= 0.75) continue;

    followUpQuestions.push({ ...q, _reason: rule.reason });
  }

  const missingCritical = schema.seedQuestions
    .filter((q) => {
      if (q.optional || merged[q.id]?.trim()) return false;
      if (isKbEnrichedField(q.id, enrichmentSources, 0.7)) return false;
      return true;
    })
    .map((q) => q.text);

  const missingOptional = schema.dynamicRules
    .filter((rule) => rule.when(merged))
    .map((rule) => schema.dynamicQuestions?.[rule.questionId])
    .filter((q) => q?.optional && !merged[q?.id]?.trim())
    .map((q) => q.text);

  const qualityScore = schema.estimateQuality
    ? schema.estimateQuality(merged, followUpQuestions.length)
    : 0.5;

  // 分析確信度: 課題分析 + 入力品質
  const analysisConfidence = Math.round(
    ((challenge.confidence ?? 0.5) + qualityScore) / 2 * 100
  ) / 100;

  const requiredFollowUps = followUpQuestions.filter((q) => !q.optional);

  const canGenerate = missingCritical.length === 0;
  const canProceedToBlueprint =
    canGenerate &&
    requiredFollowUps.length === 0 &&
    (analysisConfidence >= 0.4 || enrichmentConfidence >= 0.65);

  // KB 補完分を inferredAnswers にマージ（UI・Blueprint で参照）
  const kbInferred = {};
  for (const src of enrichmentSources) {
    if (src.field && src.value && !answers[src.field]?.trim()) {
      kbInferred[src.field] = src.value;
    }
  }

  return {
    followUpQuestions,
    inferredAnswers: { ...inferredAnswers, ...kbInferred },
    canGenerate,
    canProceedToBlueprint,
    qualityScore,
    analysisConfidence,
    missingCritical,
    missingOptional,
    enrichmentConfidence,
    kbEnrichedFields: enrichmentSources.map((s) => s.field),
  };
}

/**
 * Schema 未登録カテゴリ用の空ギャップ結果
 */
export function emptyGapAnalysis() {
  return {
    followUpQuestions: [],
    inferredAnswers: {},
    canGenerate: true,
    canProceedToBlueprint: true,
    qualityScore: 0.5,
    analysisConfidence: 0.5,
    missingCritical: [],
    missingOptional: [],
    enrichmentConfidence: 0,
    kbEnrichedFields: [],
  };
}
