/**
 * 成果物 — 共通分析パイプライン
 */

import { runGapAnalysis, getSchemaForCategory } from "../../schemas/index.js";
import { assembleThinkingResult } from "../thinkingCore.js";
import { getDeliverableHandler } from "../../deliverables/registry.js";

/**
 * @param {string} categoryId
 * @param {Object} answers
 */
export function runDeliverablePipeline(categoryId, answers) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) {
    throw new Error(`Schema 未登録のカテゴリ: ${categoryId}`);
  }

  const gap = runGapAnalysis(categoryId, answers);
  const merged = { ...gap.inferredAnswers, ...answers, _inferred: gap.inferredAnswers };
  const { build, render } = getDeliverableHandler(schema.useCaseId);

  const blueprint = build(merged);
  const deliverablePrompt = render(blueprint);

  const thinking = assembleThinkingResult({
    purpose: blueprint.purpose || `${schema.label}の成果物を生成`,
    missingInfo: gap.missingCritical,
    constraints: blueprint.constraintsSummary || "",
    outputFormat: blueprint.outputFormat || schema.label,
    improvements: blueprint.improvementPoints || [],
    notes: blueprint.notes || "",
    output: { blueprint, deliverablePrompt, qualityScore: blueprint.quality?.score },
    meta: {
      client: "prompt",
      scenario: "deliverable",
      useCaseId: schema.useCaseId,
      categoryId,
      gapQuality: gap.qualityScore,
      lensCount: blueprint.lensReviews?.length || 0,
    },
  });

  thinking.deliverableBlueprint = blueprint;
  thinking.deliverablePrompt = deliverablePrompt;
  thinking.qualityScore = blueprint.quality?.score ?? gap.qualityScore;

  return thinking;
}
