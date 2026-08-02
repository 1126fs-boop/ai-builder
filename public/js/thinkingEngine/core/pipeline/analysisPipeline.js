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
import { enrichAnswersFromKnowledge } from "../analyzers/inputEnricher.js";
import { planStructure } from "../analyzers/structurePlanner.js";
import { buildKnowledgeSnapshot } from "../knowledge/knowledgeRegistry.js";
import { applyKnowledgeToBlueprint } from "../knowledge/knowledgeApplicator.js";
import { buildAnalysisIntelligence } from "../analyzers/analysisIntelligence.js";
import { createAnalysisContext } from "../types/analysisContext.js";
import { generatePersistableId } from "../types/persistable.js";

export function runWizardAnalysis(categoryId, answers, options = {}) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) return { gap: emptyGapAnalysis(), purpose: null, challenge: null, enrichment: null };

  const enrichment = enrichAnswersFromKnowledge(categoryId, answers, schema);
  const enrichedAnswers = enrichment.answers;

  const purpose = analyzePurpose(categoryId, enrichedAnswers, schema);
  const challenge = analyzeChallenge(categoryId, enrichedAnswers, purpose);
  const gap = analyzeGaps(categoryId, enrichedAnswers, schema, purpose, challenge, {
    enrichedFields: enrichment.enrichedFields,
    enrichmentSources: enrichment.enrichmentSources,
    enrichmentConfidence: enrichment.enrichmentConfidence,
    askedQuestionIds: options.askedQuestionIds ?? [],
  });

  return { gap, purpose, challenge, enrichment };
}

export function runAnalysisPipeline(categoryId, answers, options = {}) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) {
    throw new Error(`Schema 未登録のカテゴリ: ${categoryId}`);
  }

  const sessionId = options.sessionId ?? generatePersistableId("ses");
  const phases = [];
  const startedAt = Date.now();

  const enrichment = enrichAnswersFromKnowledge(categoryId, answers, schema);
  const enrichedAnswers = enrichment.answers;
  phases.push({
    id: "enrichment",
    label: "入力補完（KB+トレンド）",
    ok: enrichment.enrichedFields.length > 0,
    meta: {
      enrichedFields: enrichment.enrichedFields,
      confidence: enrichment.enrichmentConfidence,
    },
  });

  const purpose = analyzePurpose(categoryId, enrichedAnswers, schema);
  phases.push({ id: "purpose", label: "目的分析", ok: true });

  const challenge = analyzeChallenge(categoryId, enrichedAnswers, purpose);
  phases.push({ id: "challenge", label: "経営課題分析", ok: true, confidence: challenge.confidence });

  const gap = analyzeGaps(categoryId, enrichedAnswers, schema, purpose, challenge, {
    enrichedFields: enrichment.enrichedFields,
    enrichmentSources: enrichment.enrichmentSources,
    enrichmentConfidence: enrichment.enrichmentConfidence,
  });
  phases.push({ id: "gap", label: "不足情報判定", ok: gap.canProceedToBlueprint });

  if (!gap.canProceedToBlueprint) {
    return {
      context: null,
      gap,
      purpose,
      challenge,
      sessionId,
      canProceed: false,
      enrichment,
      meta: { phases, startedAt, completedAt: Date.now() },
    };
  }

  const mergedAnswers = { ...gap.inferredAnswers, ...enrichedAnswers, _inferred: gap.inferredAnswers, _kbEnrichment: enrichedAnswers._kbEnrichment };

  const knowledge = buildKnowledgeSnapshot(categoryId, mergedAnswers, challenge);
  knowledge.appliedKnowledge = applyKnowledgeToBlueprint(categoryId, knowledge, challenge, purpose);
  knowledge.appliedHints = knowledge.appliedKnowledge?.directives ?? [];

  if (knowledge.appliedKnowledge?.successCriteriaBoost?.length) {
    purpose.successCriteria = [
      ...(purpose.successCriteria ?? []),
      ...knowledge.appliedKnowledge.successCriteriaBoost,
    ].slice(0, 8);
  }

  knowledge.analysisIntelligence = buildAnalysisIntelligence(
    categoryId,
    knowledge,
    challenge,
    purpose,
    mergedAnswers
  );

  if (knowledge.analysisIntelligence?.qualitySuccessCriteria?.length) {
    purpose.successCriteria = [
      ...(purpose.successCriteria ?? []),
      ...knowledge.analysisIntelligence.qualitySuccessCriteria,
    ].slice(0, 10);
  }

  phases.push({ id: "knowledge", label: "Knowledge参照", ok: true });
  phases.push({
    id: "intelligence",
    label: "統合分析（KB+トレンド+学習+ルーブリック）",
    ok: Boolean(knowledge.analysisIntelligence),
  });

  const { lensReviews, synthesis, council } = runLensEngine(categoryId, { purpose, challenge, knowledge });
  phases.push({
    id: "lens",
    label: "AI会議（Lens）",
    ok: lensReviews.length >= 2,
    meta: council
      ? {
          panel: council.panelLabels,
          rounds: council.roundCount,
          qualityScore: council.qualityGate?.score,
          qualityPassed: council.qualityPassed,
          iterations: council.councilIterations,
        }
      : null,
  });
  phases.push({
    id: "council_quality",
    label: "品質判定（ルーブリック）",
    ok: council?.qualityPassed !== false,
    meta: council?.qualityHistory ?? null,
  });

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
      council,
    },
  });

  // structure / lens を payload 直下にも保持（Prompt Builder 参照用）
  context.payload.structure = structure;
  context.payload.lensReviews = lensReviews;
  context.payload.synthesis = synthesis;
  if (council) context.payload.lensCouncil = council;

  return {
    context,
    gap,
    purpose,
    challenge,
    sessionId,
    canProceed: true,
    enrichment,
    meta: context.payload.meta,
  };
}
