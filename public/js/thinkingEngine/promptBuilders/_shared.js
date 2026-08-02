/**
 * Prompt Builder — 共通ユーティリティ
 *
 * AI非依存。Knowledge → プロンプト束への変換。
 * 公式HPは Knowledge Base のみ。デザインは毎回 AI が新規設計。
 */

import {
  DEFAULT_EVALUATION_CRITERIA,
  DEFAULT_THINKING_PROCESS,
  BASE_RULES,
} from "../domainKnowledge.js";
import {
  buildBrandRulesBlock,
  buildBrandWorldviewBlock,
  buildWamProductKnowledgeBlock,
  buildAnalysisReflectionBlock,
  buildKbScopeBlock,
  buildCreativeAntiPatternsBlock,
} from "../core/knowledge/wamKnowledgeBase.js";
import { buildFullKnowledgeBlock } from "../core/knowledge/knowledgeRegistry.js";
import { formatAppliedHintsForPrompt } from "../core/knowledge/knowledgeApplicator.js";
import { buildCategoryPlaybookBlock } from "../core/knowledge/categoryPlaybooks.js";
import { buildCategoryKnowledgeBlock } from "../core/knowledge/categoryKnowledgeRegistry.js";
import { buildTrendsKnowledgeBlock } from "../core/knowledge/trendsKnowledgeStore.js";
import { buildRubricQualityBlock } from "../core/quality/rubricLearningRegistry.js";
import { formatAnalysisIntelligenceSummary } from "../core/analyzers/analysisIntelligence.js";
import {
  buildCreativeScenePrompt,
  buildCreativeDesignPrinciplesBlock,
} from "../core/creative/creativeDesignEngine.js";

/** 標準 systemPrompt の骨格 */
export function buildSystemPrompt(config) {
  const {
    role,
    mission,
    constraints = [],
    companyRules = [],
    antiPatterns = [],
    evaluationCriteria = DEFAULT_EVALUATION_CRITERIA,
    includeCreativeRules = false,
  } = config;

  const lines = [
    `# 役割\n${role}`,
    `# ミッション\n${mission}`,
    `# 思考プロセス\n${DEFAULT_THINKING_PROCESS}`,
    `# 評価基準\n${evaluationCriteria}`,
    buildBrandRulesBlock(),
  ];

  if (includeCreativeRules) {
    lines.push(
      buildKbScopeBlock(),
      buildBrandWorldviewBlock(),
      buildCreativeAntiPatternsBlock()
    );
  }

  lines.push(
    `# 制約`,
    ...constraints.map((c) => `- ${c}`),
    ...companyRules.map((c) => `- ${c}`),
    ...antiPatterns.slice(0, 4).map((c) => `- ${c}`),
    `- 自然な日本語。AIっぽい表現禁止`
  );

  return lines.join("\n\n");
}

/** 公式HP ProductKnowledge → プロンプトブロック（WAM KB 委譲） */
export function buildProductKnowledgeBlock(productKnowledge, answers) {
  return buildWamProductKnowledgeBlock(productKnowledge, answers);
}

/** thinkingCore 分析結果ブロック（再エクスポート） */
export { buildAnalysisReflectionBlock };

const USE_CASE_CATEGORY = {
  sns_image: "sns",
  pop_promo: "image",
  proposal_doc: "proposal",
  newsletter_line: "newsletter",
  sales_talk: "sales",
};

/** Blueprint からカテゴリ ID を解決 */
export function resolveCategoryFromBlueprint(blueprint) {
  return blueprint.categoryId || USE_CASE_CATEGORY[blueprint.useCaseId] || "proposal";
}

/** Knowledge Base 統合ブロック（ドメイン + 学習 + 適用ヒント + カテゴリPlaybook） */
export function buildKnowledgePromptBlock(blueprint) {
  const bp = blueprint?.payload ? blueprint.payload : blueprint;
  const categoryId = resolveCategoryFromBlueprint(bp);
  const knowledge = bp.knowledgeSnapshot ?? {};
  const domainBlock = buildFullKnowledgeBlock(categoryId, knowledge);
  const appliedBlock = formatAppliedHintsForPrompt(bp.appliedKnowledge ?? knowledge.appliedKnowledge);
  const playbookBlock = buildCategoryPlaybookBlock(categoryId, {
    challenge: bp.challenge ?? bp.challengeAnalysis,
    location: bp.displayLocation,
    seasonal: bp.seasonalContext,
    appealAxis: bp.appealAxis,
    salesType: bp.salesType,
  });
  const categoryKbBlock = buildCategoryKnowledgeBlock(categoryId, {
    appealAxis: bp.appealAxis,
    salesType: bp.salesType,
    displayLocation: bp.displayLocation,
    surfaceChallenge: bp.challenge?.surfaceChallenge ?? bp.surfaceChallenge,
    seasonalLabel: bp.seasonalContext?.label,
  });
  const trendsBlock = buildTrendsKnowledgeBlock(categoryId);
  const intelligence = knowledge.analysisIntelligence;
  const intelligenceBlock = intelligence
    ? [formatAnalysisIntelligenceSummary(intelligence), intelligence.rubricBlock].filter(Boolean).join("\n\n")
    : buildRubricQualityBlock(categoryId);

  return [domainBlock, categoryKbBlock, trendsBlock, intelligenceBlock, appliedBlock, playbookBlock]
    .filter(Boolean)
    .join("\n\n");
}

/** @deprecated buildBackgroundImagePrompt — buildCreativeScenePrompt を使用 */
export function buildBackgroundImagePrompt(config) {
  return buildCreativeScenePrompt({
    formatLabel: config.formatLabel || "promotional creative",
    sceneConcept: config.style || "professional beauty promotional scene",
    mood: config.mood || "trustworthy",
    colorPalette: config.colorPalette || ["neutral tones"],
    compositionStyle: config.compositionStyle || "original asymmetric layout",
    typographyStyle: config.typographyStyle || "modern hierarchy",
    aspect: config.aspect || "1:1",
    targetAudience: config.targetAudience || "salon owner",
    appealAxis: config.appealAxis || "benefits",
    productPlacement: { position: config.productZone || "compositional space" },
  });
}

/** 画像系 — negativePrompt 標準 */
export function buildStandardNegativePrompt() {
  return [
    "product, device, machine, cosmetic bottle, packaging, logo,",
    "beauty equipment, salon machine, fake product, generated product,",
    "website screenshot, homepage layout, web page design, browser UI,",
    "official website reproduction, template reuse, identical layout,",
    "text artifacts, watermark, low quality, blurry",
  ].join(" ");
}

/** imageDirective オブジェクト */
export function buildImageDirective(productKnowledge, structure, answers, creativeBrief) {
  const layout = structure?.layoutSpec;
  const brief = creativeBrief ?? structure?.creativeBrief ?? null;

  return {
    mode: productKnowledge?.imageMode ?? "background_only",
    officialImageUrl: productKnowledge?.officialImageUrl ?? null,
    productName: productKnowledge?.name ?? answers.wam_product ?? null,
    productDescription: productKnowledge?.description ?? null,
    officialUrl: productKnowledge?.officialUrl ?? null,
    layoutSpec: layout ?? null,
    creativeBrief: brief,
    designMode: "original_creative",
    doNotMimicOfficialWebsite: true,
    uploadGuidance:
      productKnowledge?.imageMode === "upload_required"
        ? "公式商品画像または正規パッケージ写真をアップロードしてください"
        : null,
  };
}

/** synthesis の Prompt Builder 向けヒント */
export function formatSynthesisHints(synthesis) {
  if (!synthesis) return "";
  const parts = [];
  if (synthesis.finalDirection) parts.push(`【設計方向】${synthesis.finalDirection}`);
  if (synthesis.agreedPoints?.length) {
    parts.push("【多視点で合意】\n" + synthesis.agreedPoints.map((p) => `- ${p}`).join("\n"));
  }
  return parts.join("\n\n");
}

export { buildCreativeScenePrompt, buildCreativeDesignPrinciplesBlock };

/** デフォルト営業制約 */
export const DEFAULT_CONSTRAINTS = [...BASE_RULES];
