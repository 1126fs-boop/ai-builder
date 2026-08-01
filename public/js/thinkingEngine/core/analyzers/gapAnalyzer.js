/**
 * フェーズ3 — 不足情報判定（Dynamic 質問決定）
 */

/**
 * @param {string} categoryId
 * @param {Object} answers
 * @param {import("../../schemas/types.js").UseCaseSchema} schema
 * @param {import("../types/analysisContext.js").PurposeAnalysis} purpose
 * @param {import("../types/analysisContext.js").ChallengeAnalysis} challenge
 * @returns {import("../types/analysisContext.js").GapAnalysis}
 */
export function analyzeGaps(categoryId, answers, schema, purpose, challenge) {
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
    analysisConfidence >= 0.4;

  return {
    followUpQuestions,
    inferredAnswers,
    canGenerate,
    canProceedToBlueprint,
    qualityScore,
    analysisConfidence,
    missingCritical,
    missingOptional,
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
  };
}
