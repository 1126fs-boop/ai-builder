/**
 * フェーズ3 — 品質補完（不足情報判定）
 *
 * 診断で止めず、不足項目を特定 → 1問ずつ追加質問 → 再採点できるよう設計。
 * 自由記述はウィザード固定ステップで先に取得し、充足済み項目は再質問しない。
 */

import { isKbEnrichedField } from "./inputEnricher.js";
import {
  parseFreeInputDirectives,
  isQualityFieldSatisfiedByFreeInput,
} from "./freeInputParser.js";
import {
  DEFAULT_MINIMUM_QUALITY_SCORE,
  SUPPLEMENT_QUESTIONS_PER_ROUND,
  applyFreeInputQualityBonus,
  computeRequiredFieldCoverage,
  evaluateQualitySufficiency,
} from "../../schemas/_sharedSchemaFields.js";

/**
 * @param {import("../../schemas/types.js").UseCaseSchema} schema
 * @param {string} fieldId
 */
function getQuestionForField(schema, fieldId) {
  return schema.dynamicQuestions?.[fieldId] ?? schema.seedQuestions?.find((q) => q.id === fieldId) ?? null;
}

/**
 * フィールドが回答済みか（自由記述・KB推定含む）
 */
function isFieldFilled(fieldId, ctx) {
  const { merged, enrichmentSources, directives } = ctx;
  if (merged[fieldId]?.trim()) return true;
  if (isQualityFieldSatisfiedByFreeInput(fieldId, { merged, enrichmentSources, directives })) return true;
  if (isKbEnrichedField(fieldId, enrichmentSources, 0.72)) return true;
  return false;
}

/**
 * 不足フィールドIDを優先して次の補完質問を1件選ぶ
 */
function pickSupplementQuestions(schema, ctx) {
  const {
    merged,
    missingQualityFieldIds,
    askedQuestionIds,
    enrichmentSources,
    qualitySufficient,
    minimumQualityScore,
    qualityScore,
    directives,
  } = ctx;

  if (qualitySufficient) return [];

  // 1. 品質必須フィールドの不足を最優先（1問ずつ）
  for (const fieldId of missingQualityFieldIds) {
    if (isFieldFilled(fieldId, ctx)) continue;
    const q = getQuestionForField(schema, fieldId);
    if (!q || q.id === "free_input") continue;
    if (askedQuestionIds.has(q.id) && q.optional) continue;
    if (askedQuestionIds.has(q.id) && !q.optional) {
      return [
        {
          ...q,
          _reason: `品質に必要な「${q.text.replace(/[？?]$/, "")}」への回答が不足しています`,
          _supplementType: "required_field",
        },
      ];
    }
    if (!askedQuestionIds.has(q.id)) {
      const kbThreshold = q.qualityImpact === "critical" ? 0.88 : 0.72;
      if (isKbEnrichedField(q.id, enrichmentSources, kbThreshold)) continue;
      if (isQualityFieldSatisfiedByFreeInput(q.id, { merged, enrichmentSources, directives })) continue;
      return [
        {
          ...q,
          _reason: `品質向上のため「${q.text.replace(/[？?]$/, "")}」を確認させてください`,
          _supplementType: "required_field",
        },
      ];
    }
  }

  // 2. dynamicRules から不足項目（自由記述で充足済みはスキップ）
  const candidates = schema.dynamicRules
    .filter((rule) => rule.when(merged))
    .sort((a, b) => b.priority - a.priority);

  for (const rule of candidates) {
    const q = schema.dynamicQuestions?.[rule.questionId];
    if (!q || q.id === "free_input") continue;
    if (askedQuestionIds.has(q.id)) continue;
    if (isFieldFilled(q.id, ctx)) continue;

    const kbThreshold = q.qualityImpact === "critical" ? 0.88 : 0.72;
    if (isKbEnrichedField(q.id, enrichmentSources, kbThreshold)) continue;
    if (q.optional && qualityScore >= minimumQualityScore - 0.08) continue;

    return [{ ...q, _reason: rule.reason, _supplementType: "dynamic" }];
  }

  return [];
}

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
  const directives = parseFreeInputDirectives(merged.free_input);

  const fieldCtx = { merged, enrichmentSources, directives };

  let baseQuality = schema.estimateQuality?.(merged, 0) ?? 0.5;
  baseQuality = applyFreeInputQualityBonus(baseQuality, merged, directives);

  const isFilled = (fieldId) => isFieldFilled(fieldId, fieldCtx);
  const requiredCoverage = computeRequiredFieldCoverage(merged, qualityRequiredFields, isFilled);

  const missingQualityFieldIds = qualityRequiredFields.filter((f) => !isFilled(f));
  const missingQualityFields = missingQualityFieldIds.map(
    (f) => getQuestionForField(schema, f)?.text || f
  );

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

  const followUpQuestions = canGenerate
    ? pickSupplementQuestions(schema, {
        merged,
        missingQualityFieldIds,
        askedQuestionIds,
        enrichmentSources,
        qualitySufficient,
        minimumQualityScore,
        qualityScore,
        directives,
      }).slice(0, SUPPLEMENT_QUESTIONS_PER_ROUND)
    : [];

  const requiredFollowUps = followUpQuestions.filter((q) => !q.optional);
  const canProceedToBlueprint =
    canGenerate &&
    qualitySufficient &&
    requiredFollowUps.length === 0;

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
    missingQualityFieldIds,
    requiredCoverage,
    minimumQualityScore,
    qualitySufficient: canProceedToBlueprint,
    canProceedToBlueprint,
    userDirectives: directives.hasContent ? directives : null,
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
    missingQualityFieldIds: ctx.missingQualityFieldIds ?? [],
    requiredFieldCoverage: ctx.requiredCoverage,
    minimumQualityScore: ctx.minimumQualityScore,
    qualitySufficient: sufficient,
    enrichmentConfidence: ctx.enrichmentConfidence,
    kbEnrichedFields: ctx.enrichmentSources.map((s) => s.field),
    userDirectives: ctx.userDirectives ?? null,
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
    missingQualityFieldIds: [],
    requiredFieldCoverage: 1,
    minimumQualityScore: DEFAULT_MINIMUM_QUALITY_SCORE,
    qualitySufficient: true,
    enrichmentConfidence: 0,
    kbEnrichedFields: [],
    userDirectives: null,
  };
}
