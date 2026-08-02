/**
 * 成果物 — プロンプト生成パイプライン（Phase B）
 *
 * アプリの責務は GeneratedPrompt の設計まで。
 * AnalysisContext → Blueprint → GeneratedPrompt
 */

import { getSchemaForCategory } from "../../schemas/index.js";
import { assembleThinkingResult } from "../thinkingCore.js";
import { getDeliverableHandler } from "../../deliverables/registry.js";
import { runAnalysisPipeline } from "./analysisPipeline.js";
import { createBlueprint, unwrapBlueprint } from "../types/blueprint.js";
import {
  createGeneratedPrompt,
  getPrimaryPromptText,
} from "../types/generatedPrompt.js";
import {
  CATEGORY_RECOMMENDED_ADAPTERS,
  CATEGORY_EXPECTED_ARTIFACT,
} from "../categoryConfig.js";
import {
  runQualityGate,
  enrichBlueprintForRetry,
  MAX_QUALITY_RETRIES,
} from "../quality/rubricFramework.js";
import { enrichBlueprintWithKnowledge } from "../knowledge/knowledgeApplicator.js";

export function runDeliverablePipeline(categoryId, answers, options = {}) {
  const schema = getSchemaForCategory(categoryId);
  if (!schema) {
    throw new Error(`Schema 未登録のカテゴリ: ${categoryId}`);
  }

  const analysis = runAnalysisPipeline(categoryId, answers, options);
  if (!analysis.canProceed || !analysis.context) {
    throw new Error(
      analysis.gap.followUpQuestions.length > 0
        ? "分析未完成: 追加質問への回答が必要です"
        : "分析未完成: 必須項目が不足しています"
    );
  }

  const ctx = analysis.context;
  const sessionId = analysis.sessionId;
  const { build, buildPrompts } = getDeliverableHandler(schema.useCaseId);

  let blueprintPayload = enrichBlueprintWithKnowledge(
    build(ctx),
    categoryId,
    ctx.payload.knowledge
  );
  let promptBundle = null;
  let qualityGate = null;
  let blueprint = null;
  let retryCount = 0;

  while (retryCount <= MAX_QUALITY_RETRIES) {
    blueprint = createBlueprint({
      contextId: ctx.id,
      categoryId,
      useCaseId: schema.useCaseId,
      payload: blueprintPayload,
      quality: blueprintPayload.quality,
      sessionId,
    });

    promptBundle = buildPrompts(blueprint);
    qualityGate = runQualityGate(categoryId, blueprintPayload, promptBundle);

    if (qualityGate.passed || retryCount >= MAX_QUALITY_RETRIES) {
      break;
    }

    blueprintPayload = enrichBlueprintForRetry(blueprintPayload, qualityGate.improvements);
    retryCount += 1;
  }
  const imageDirective =
    promptBundle._imageDirective ??
    (blueprintPayload.productAsset
      ? {
          mode: blueprintPayload.productAsset.imageMode,
          officialImageUrl: blueprintPayload.productAsset.officialImageUrl,
          productName: blueprintPayload.productAsset.name,
          productDescription: blueprintPayload.productAsset.description,
          layoutSpec: blueprintPayload.layoutSpec ?? null,
          creativeBrief: blueprintPayload.creativeBrief ?? null,
          designMode: "original_creative",
          doNotMimicOfficialWebsite: true,
        }
      : null);

  const { _imageDirective, ...prompts } = promptBundle;

  const generatedPrompt = createGeneratedPrompt({
    contextId: ctx.id,
    blueprintId: blueprint.id,
    categoryId,
    useCaseId: schema.useCaseId,
    prompts,
    imageDirective,
    recommendedAdapters: CATEGORY_RECOMMENDED_ADAPTERS[categoryId] ?? ["chatgpt"],
    expectedArtifact: CATEGORY_EXPECTED_ARTIFACT[categoryId] ?? { type: "text", label: "テキスト" },
    sessionId,
    extensions: {
      qualityGate: qualityGate
        ? {
            score: qualityGate.score,
            passed: qualityGate.passed,
            blueprintScore: qualityGate.blueprintScore,
            promptScore: qualityGate.promptScore,
            retryCount,
          }
        : null,
    },
  });

  const unwrapped = unwrapBlueprint(blueprint);
  const primaryText = getPrimaryPromptText(generatedPrompt);

  const thinking = assembleThinkingResult({
    purpose: unwrapped.purpose?.primaryGoal ?? ctx.payload.purpose.primaryGoal,
    missingInfo: ctx.payload.gap.missingCritical,
    constraints: unwrapped.constraintsSummary || ctx.payload.purpose.constraints.join("\n"),
    outputFormat: unwrapped.outputFormat || schema.label,
    improvements: unwrapped.improvementPoints || [],
    notes: unwrapped.notes || "",
    output: {
      analysisContext: ctx,
      blueprint,
      generatedPrompt,
      qualityScore: unwrapped.quality?.score,
    },
    meta: {
      client: "prompt",
      scenario: "generated_prompt",
      useCaseId: schema.useCaseId,
      categoryId,
      sessionId,
      enginePhase: "B",
      analysisContextId: ctx.id,
      blueprintId: blueprint.id,
      generatedPromptId: generatedPrompt.id,
    },
  });

  thinking.analysisContext = ctx;
  thinking.deliverableBlueprint = blueprint;
  thinking.generatedPrompt = generatedPrompt;
  thinking.deliverablePrompt = primaryText;
  thinking.qualityScore = qualityGate?.score ?? unwrapped.quality?.score ?? ctx.payload.gap.qualityScore;
  thinking.qualityGate = qualityGate;

  return thinking;
}
