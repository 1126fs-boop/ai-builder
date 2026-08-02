/**
 * フェーズ3 — 不足情報判定（Dynamic 質問決定）
 *
 * 品質最優先: 十分なら追問ゼロ。不足時だけ必要な分だけ聞く。
 * 自由記述は「項目を増やす」ためではなく、品質補完の最終手段。
 */

import { isKbEnrichedField } from "./inputEnricher.js";
import { parseFreeInput } from "./freeInputParser.js";
import {
  DEFAULT_MINIMUM_QUALITY_SCORE,
  DEFAULT_MAX_DYNAMIC_PER_ROUND,
  EXPANDED_MAX_DYNAMIC_PER_ROUND,
  FREE_INPUT_QUESTION,
  applyFreeInputQualityBonus,
  computeRequiredFieldCoverage,
  evaluateQualitySufficiency,
} from "../../schemas/_sharedSchemaFields.js";

/**
 * @param {string} categoryId
 * @param {Object} answers
 * @param {import("../../schemas/types.js").UseCaseSchema} schema
 * @param {import("../types/analysisContext.js").PurposeAnalysis} purpose
 * @param {import("../types/analysisContext.js").ChallengeAnalysis} challenge
 * @param {{ enrichedFields?: string[], enrichmentSources?: Object[], enrichmentConfidence?: number, askedQuestionIds?: string[] }} [options]
 */
export function analyzeGaps(categoryId, answers, schema, purpose, challenge, options = {}) {
  const enrichmentSources = options.enrichmentSources ?? [];
  const enrichmentConfidence = options.enrichmentConfidence ?? 0;
  const askedQuestionIds = new Set(options.askedQuestionIds ?? []);

  const inferredAnswers = schema.inferDefaults?.(answers) || {};
  const merged = { ...inferredAnswers, ...answers };

  const minimumQualityScore = schema.minimumQualityScore ?? DEFAULT_MINIMUM_QUALITY_SCORE;
  const qualityRequiredFields = schema.qualityRequiredFields ?? [];

  let baseQuality = schema.estimateQuality?.(merged, 0) ?? 0.5;
  baseQuality = applyFreeInputQualityBonus(baseQuality, merged);

  const requiredCoverage = computeRequiredFieldCoverage(merged, qualityRequiredFields);
  const freeMeta = parseFreeInput(merged.free_input);

  const missingQualityFields = qualityRequiredFields
    .filter((f) => !merged[f]?.trim())
    .map((f) => schema.dynamicQuestions?.[f]?.text || schema.seedQuestions?.find((q) => q.id === f)?.text || f);

  const qualityScore = Math.round(
    Math.min(1, baseQuality * 0.7 + requiredCoverage * 0.3) * 100
  ) / 100;

  const { sufficient: qualitySufficient } = evaluateQualitySufficiency({
    qualityScore,
    minimumQualityScore,
    requiredCoverage,
    missingQualityFields,
  });

  const missingCritical = schema.seedQuestions
    .filter((q) => {
      if (q.optional) return false;
      if (merged[q.id]?.trim()) return false;
      if (isKbEnrichedField(q.id, enrichmentSources, 0.85)) return false;
      return true;
    })
    .map((q) => q.text);

  const canGenerate = missingCritical.length === 0;

  // 品質十分 → 追問なし（2〜3問で終了してOK）
  if (canGenerate && qualitySufficient) {
    return buildGapResult({
      followUpQuestions: [],
      inferredAnswers,
      enrichmentSources,
      answers,
      canGenerate,
      qualityScore,
      challenge,
      enrichmentConfidence,
      missingCritical,
      missingQualityFields,
      requiredCoverage,
      minimumQualityScore,
      qualitySufficient: true,
    });
  }

  // 品質不足 → 構造化された追問のみ（必要な分だけ）
  const maxThisRound =
    qualityScore < minimumQualityScore || requiredCoverage < 0.75
      ? EXPANDED_MAX_DYNAMIC_PER_ROUND
      : schema.maxDynamicQuestions ?? DEFAULT_MAX_DYNAMIC_PER_ROUND;

  const candidates = schema.dynamicRules
    .filter((rule) => rule.when(merged))
    .sort((a, b) => b.priority - a.priority);

  const followUpQuestions = [];
  for (const rule of candidates) {
    if (followUpQuestions.length >= maxThisRound) break;
    const q = schema.dynamicQuestions?.[rule.questionId];
    if (!q || q.id === "free_input") continue;
    if (askedQuestionIds.has(q.id)) continue;
    if (merged[q.id]?.trim()) continue;

    const kbSkipThreshold = q.qualityImpact === "critical" ? 0.88 : 0.72;
    if (isKbEnrichedField(q.id, enrichmentSources, kbSkipThreshold)) continue;

    if (q.optional && qualitySufficient) continue;
    if (q.qualityImpact === "medium" && qualityScore >= minimumQualityScore - 0.05) continue;

    followUpQuestions.push({ ...q, _reason: rule.reason });
  }

  // 構造化追問が尽き、まだ品質不足 → 自由記述を1回だけ提示（品質補完用）
  if (
    followUpQuestions.length === 0 &&
    !qualitySufficient &&
    !merged.free_input?.trim() &&
    !askedQuestionIds.has("free_input")
  ) {
    followUpQuestions.push({
      ...FREE_INPUT_QUESTION,
      _reason:
        "現時点の情報では品質基準に届かない可能性があります。補足があれば入力してください（スキップ可）",
    });
  }

  const requiredFollowUps = followUpQuestions.filter((q) => !q.optional);
  const canProceedAfter =
    canGenerate &&
    requiredFollowUps.length === 0 &&
    qualitySufficient;

  return buildGapResult({
    followUpQuestions,
    inferredAnswers,
    enrichmentSources,
    answers,
    canGenerate,
    qualityScore,
    challenge,
    enrichmentConfidence,
    missingCritical,
    missingQualityFields,
    requiredCoverage,
    minimumQualityScore,
    qualitySufficient: canProceedAfter,
    canProceedToBlueprint: canProceedAfter,
  });
}

function buildGapResult(ctx) {
  const kbInferred = {};
  for (const src of ctx.enrichmentSources) {
    if (src.field && src.value && !ctx.answers[src.field]?.trim()) {
      kbInferred[src.field] = src.value;
    }
  }

  const analysisConfidence = Math.round(
    ((ctx.challenge.confidence ?? 0.5) + ctx.qualityScore) / 2 * 100
  ) / 100;

  const sufficient = ctx.qualitySufficient ?? false;

  return {
    followUpQuestions: ctx.followUpQuestions,
    inferredAnswers: { ...ctx.inferredAnswers, ...kbInferred },
    canGenerate: ctx.canGenerate,
    canProceedToBlueprint: ctx.canProceedToBlueprint ?? sufficient,
    qualityScore: ctx.qualityScore,
    analysisConfidence,
    missingCritical: ctx.missingCritical,
    missingOptional: [],
    missingQualityFields: ctx.missingQualityFields,
    requiredFieldCoverage: ctx.requiredCoverage,
    minimumQualityScore: ctx.minimumQualityScore,
    qualitySufficient: sufficient,
    enrichmentConfidence: ctx.enrichmentConfidence,
    kbEnrichedFields: ctx.enrichmentSources.map((s) => s.field),
  };
}

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
    missingQualityFields: [],
    requiredFieldCoverage: 1,
    minimumQualityScore: DEFAULT_MINIMUM_QUALITY_SCORE,
    qualitySufficient: true,
    enrichmentConfidence: 0,
    kbEnrichedFields: [],
  };
}
