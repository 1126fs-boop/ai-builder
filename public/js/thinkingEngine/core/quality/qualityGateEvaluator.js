/**
 * Quality Gate — 正直な多軸品質評価
 *
 * 100点は「これ以上改善点がない」と判断した場合のみ。
 * 90点台でも十分ならそのまま生成可能。
 */

import { getSchemaForCategory } from "../../schemas/index.js";
import { parseFreeInputDirectives } from "../analyzers/freeInputParser.js";
import { getShortFieldLabel } from "./qualityStatusFormatter.js";

/** 生成可能ライン（0〜1） — これ以上なら追問なしで生成可 */
export const GENERATION_QUALITY_THRESHOLD = 0.72;

/** このスコア以上なら任意項目の追問はせず改善提案のみ（0〜1） */
export const HIGH_QUALITY_THRESHOLD = 0.88;

/** 満点判定 — 全軸がこの値以上かつ改善提案ゼロ */
const PERFECT_DIMENSION_MIN = 96;

/**
 * @param {Object} ctx
 */
export function evaluateQualityGate(ctx) {
  const {
    categoryId,
    merged,
    rawAnswers = merged,
    enrichmentSources = [],
    schema,
    purpose,
    challenge,
  } = ctx;

  const directives = parseFreeInputDirectives(merged.free_input);
  const qualityRequiredFields = schema?.qualityRequiredFields ?? [];
  const minimumQualityScore = schema?.minimumQualityScore ?? 0.65;

  const dimensions = [
    scoreInformationVolume(rawAnswers, enrichmentSources, qualityRequiredFields, directives),
    scoreTargetClarity(categoryId, rawAnswers, merged, enrichmentSources),
    scoreAppealStrength(categoryId, rawAnswers, merged, enrichmentSources),
    scoreCategoryFit(categoryId, rawAnswers, schema, enrichmentSources),
    scoreContextCompleteness(rawAnswers, merged, enrichmentSources, directives, challenge),
  ];

  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  );

  const strengths = buildStrengths(categoryId, rawAnswers, merged, directives, dimensions);
  const improvements = buildImprovements(
    categoryId,
    schema,
    rawAnswers,
    merged,
    enrichmentSources,
    dimensions,
    overallScore
  );

  const isPerfect = overallScore >= 99 && improvements.length === 0 &&
    dimensions.every((d) => d.score >= PERFECT_DIMENSION_MIN);

  const qualityScore = overallScore / 100;
  const canGenerateByScore = qualityScore >= minimumQualityScore;
  const highQuality = qualityScore >= HIGH_QUALITY_THRESHOLD;

  return {
    overallScore,
    qualityScore,
    dimensions,
    strengths,
    improvements,
    isPerfect,
    canGenerateByScore,
    highQuality,
    minimumQualityScore,
    directives,
  };
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** 情報量 — ユーザー自身の入力を重視。KB推定のみは加点控えめ */
function scoreInformationVolume(rawAnswers, enrichmentSources, requiredFields, directives) {
  if (!requiredFields.length) {
    const filled = Object.keys(rawAnswers).filter((k) => !k.startsWith("_") && rawAnswers[k]?.trim()).length;
    return { id: "information", label: "情報量", score: clamp(45 + filled * 8) };
  }

  let userFilled = 0;
  let kbOnly = 0;
  for (const fieldId of requiredFields) {
    if (rawAnswers[fieldId]?.trim()) userFilled++;
    else if (enrichmentSources.some((s) => s.field === fieldId)) kbOnly++;
  }

  const total = requiredFields.length;
  const userRatio = userFilled / total;
  let score = 35 + userRatio * 50;
  if (kbOnly > 0) score += Math.min(12, kbOnly * 4);
  if (directives.hasContent) score += Math.min(12, 6 + directives.mustIncludeKeywords.length * 2);
  if (directives.hasContent && rawAnswers.free_input?.length >= 40) score += 5;

  return { id: "information", label: "情報量", score: clamp(score) };
}

function scoreTargetClarity(categoryId, rawAnswers, merged, enrichmentSources) {
  const targetFields = {
    sns: "target_audience",
    newsletter: "audience",
    proposal: "industry",
    sales: "industry",
    image: "display_location",
  };
  const field = targetFields[categoryId];
  let score = 40;
  if (rawAnswers[field]?.trim()) score += 45;
  else if (merged[field]?.trim() && isKbField(field, enrichmentSources)) score += 22;
  if (rawAnswers.client_challenge?.trim()) score += 10;
  return { id: "target", label: "ターゲットの明確さ", score: clamp(score) };
}

function scoreAppealStrength(categoryId, rawAnswers, merged, enrichmentSources) {
  const appealFields = {
    sns: "appeal_axis",
    newsletter: "value",
    proposal: "client_challenge",
    sales: "goal",
    image: "appeal_point",
  };
  const field = appealFields[categoryId];
  let score = 38;
  if (rawAnswers[field]?.trim()) score += 42;
  else if (merged[field]?.trim()) score += isKbField(field, enrichmentSources) ? 18 : 25;
  if (rawAnswers.free_input?.trim() && /訴求|キャッチ|メリット|売上/.test(rawAnswers.free_input)) score += 8;
  return { id: "appeal", label: "訴求力", score: clamp(score) };
}

function scoreCategoryFit(categoryId, rawAnswers, schema, enrichmentSources) {
  let score = 42;
  const seedIds = schema?.seedQuestions?.filter((q) => !q.optional).map((q) => q.id) ?? [];
  const userSeedFilled = seedIds.filter((id) => rawAnswers[id]?.trim()).length;
  if (seedIds.length) score += (userSeedFilled / seedIds.length) * 40;
  if (categoryId === "sns" && rawAnswers.sns_format) score += 8;
  if (categoryId === "image" && rawAnswers.usage) score += 8;
  if (categoryId === "proposal" && rawAnswers.proposal_scope) score += 8;
  return { id: "category_fit", label: "カテゴリ適合性", score: clamp(score) };
}

function scoreContextCompleteness(rawAnswers, merged, enrichmentSources, directives, challenge) {
  let score = 40;
  const userFieldCount = Object.keys(rawAnswers).filter(
    (k) => !k.startsWith("_") && rawAnswers[k]?.trim()
  ).length;
  score += Math.min(25, userFieldCount * 4);
  if (directives.hasContent) score += 10;
  if (challenge?.confidence >= 0.7) score += 8;
  else if (challenge?.confidence >= 0.5) score += 4;
  const kbCount = enrichmentSources.filter((s) => s.source !== "schema_defaults").length;
  if (kbCount > 3) score += 5;
  return { id: "context", label: "AnalysisContext完成度", score: clamp(score) };
}

function isKbField(fieldId, sources) {
  return sources.some((s) => s.field === fieldId && s.source !== "schema_defaults");
}

function buildStrengths(categoryId, rawAnswers, merged, directives, dimensions) {
  const strengths = [];
  const top = [...dimensions].sort((a, b) => b.score - a.score)[0];
  if (top.score >= 75) strengths.push(`${top.label}が明確（${top.score}点）`);

  if (rawAnswers.free_input?.trim()) strengths.push("自由記述で要望・NG・トーンを指定");
  if (rawAnswers.client_challenge) strengths.push(`経営課題「${rawAnswers.client_challenge}」を反映`);
  if (rawAnswers.wam_product) strengths.push(`商品「${rawAnswers.wam_product}」を特定`);
  if (directives.mustIncludeKeywords?.length) {
    strengths.push(`必須キーワード: ${directives.mustIncludeKeywords.slice(0, 2).join("、")}`);
  }
  if (categoryId === "sns" && rawAnswers.sns_format && rawAnswers.appeal_axis) {
    strengths.push(`${rawAnswers.sns_format} × ${rawAnswers.appeal_axis}で設計`);
  }

  return [...new Set(strengths)].slice(0, 4);
}

function buildImprovements(categoryId, schema, rawAnswers, merged, enrichmentSources, dimensions, overallScore) {
  /** @type {string[]} */
  const improvements = [];

  const weak = dimensions.filter((d) => d.score < 70).sort((a, b) => a.score - b.score);
  for (const d of weak.slice(0, 2)) {
    improvements.push(`${d.label}を補うと品質向上（現在${d.score}点）`);
  }

  const requiredFields = schema?.qualityRequiredFields ?? [];
  for (const fieldId of requiredFields) {
    if (rawAnswers[fieldId]?.trim()) continue;
    if (!merged[fieldId]?.trim()) {
      improvements.push(`${getShortFieldLabel(fieldId, schema)}を入力すると具体性UP`);
    } else if (isKbField(fieldId, enrichmentSources)) {
      improvements.push(`${getShortFieldLabel(fieldId, schema)}はAI推定 — 確認入力で精度UP`);
    }
  }

  if (!rawAnswers.free_input?.trim() && overallScore < 92) {
    improvements.push("自由記述でNGワード・トーン・必須文言を指定できます");
  }

  if (overallScore >= 98) return [];

  return [...new Set(improvements)].slice(0, 4);
}

/**
 * 追問が必要か — 高品質なら追問せず改善提案のみ
 */
export function shouldAskSupplement(gateResult, missingUserCriticalIds) {
  if (gateResult.highQuality) return false;
  if (gateResult.overallScore >= GENERATION_QUALITY_THRESHOLD * 100 && missingUserCriticalIds.length === 0) {
    return false;
  }
  return gateResult.overallScore < HIGH_QUALITY_THRESHOLD * 100 || missingUserCriticalIds.length > 0;
}

/**
 * 生成可能か
 */
export function canGenerateWithQuality(gateResult, missingCriticalSeed, hasRequiredFollowUp) {
  if (missingCriticalSeed.length > 0) return false;
  if (hasRequiredFollowUp) return false;
  return gateResult.qualityScore >= gateResult.minimumQualityScore;
}
