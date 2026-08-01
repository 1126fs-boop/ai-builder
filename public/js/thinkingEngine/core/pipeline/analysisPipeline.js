/**
 * 分析パイプライン — Phase B（フェーズ1〜6）
 *
 * すべて Prompt Builder を強化するための分析。
 */

import { getSchemaForCategory } from "../../schemas/index.js";
import { analyzePurpose } from "../analyzers/purposeAnalyzer.js";
import { analyzeChallenge } from "../analyzers/challengeAnalyzer.js";
import { analyzeGaps, emptyGapAnalysis } from "../analyzers/gapAnalyzer.js";
import { runLensEngine } from "../analyzers/lensEngine.js";
import { planStructure } from "../analyzers/structurePlanner.js";
import { buildKnowledgeSnapshot } from "../knowledge/knowledgeRegistry.js";
import { createAnalysisContext } from "../types/analysisContext.js";
import { generatePersistableId } from "../types/persistable.js";

export function runWizardAnalysis(categoryId, answers) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) return { gap: emptyGapAnalysis(), purpose: null, challenge: null };

  const purpose = analyzePurpose(categoryId, answers, schema);
  const challenge = analyzeChallenge(categoryId, answers, purpose);
  const gap = analyzeGaps(categoryId, answers, schema, purpose, challenge);

  return { gap, purpose, challenge };
}

export function runAnalysisPipeline(categoryId, answers, options = {}) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) {
    throw new Error(`Schema 未登録のカテゴリ: ${categoryId}`);
  }

  const sessionId = options.sessionId ?? generatePersistableId("ses");
  const phases = [];
  const startedAt = Date.now();

  const purpose = analyzePurpose(categoryId, answers, schema);
  phases.push({ id: "purpose", label: "目的分析", ok: true });

  const challenge = analyzeChallenge(categoryId, answers, purpose);
  phases.push({ id: "challenge", label: "経営課題分析", ok: true, confidence: challenge.confidence });

  const gap = analyzeGaps(categoryId, answers, schema, purpose, challenge);
  phases.push({ id: "gap", label: "不足情報判定", ok: gap.canProceedToBlueprint });

  if (!gap.canProceedToBlueprint) {
    return {
      context: null,
      gap,
      purpose,
      challenge,
      sessionId,
      canProceed: false,
      meta: { phases, startedAt, completedAt: Date.now() },
    };
  }

  const mergedAnswers = { ...gap.inferredAnswers, ...answers, _inferred: gap.inferredAnswers };

  const knowledge = buildKnowledgeSnapshot(categoryId, mergedAnswers, challenge);
  phases.push({ id: "knowledge", label: "Knowledge参照", ok: true });

  const { lensReviews, synthesis } = runLensEngine(categoryId, { purpose, challenge, knowledge });
  phases.push({ id: "lens", label: "多視点レビュー", ok: lensReviews.length >= 2 });

  const structure = planStructure(categoryId, {
    purpose,
    challenge,
    knowledge,
    synthesis,
    answers: mergedAnswers,
  });
  phases.push({ id: "structure", label: "最適構成決定", ok: structure.sections.length >= 3 });

  const context = createAnalysisContext({
    categoryId,
    useCaseId: schema.useCaseId,
    answers: mergedAnswers,
    purpose,
    challenge,
    gap,
    knowledge,
    sessionId,
    meta: {
      phases,
      startedAt,
      completedAt: Date.now(),
      enginePhase: "B",
      structure,
      lensReviews,
      synthesis,
    },
  });

  // structure / lens を payload 直下にも保持（Prompt Builder 参照用）
  context.payload.structure = structure;
  context.payload.lensReviews = lensReviews;
  context.payload.synthesis = synthesis;

  return {
    context,
    gap,
    purpose,
    challenge,
    sessionId,
    canProceed: true,
    meta: context.payload.meta,
  };
}
