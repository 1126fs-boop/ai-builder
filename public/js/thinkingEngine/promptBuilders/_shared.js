/**
 * Prompt Builder — 共通ユーティリティ
 *
 * AI非依存。Knowledge → プロンプト束への変換。
 */

import {
  DEFAULT_EVALUATION_CRITERIA,
  DEFAULT_THINKING_PROCESS,
  BASE_RULES,
} from "../domainKnowledge.js";
import { WAM_OFFICIAL_SITE, WAM_PRODUCT_INDEX } from "../../../wamProducts.js";
import {
  buildBrandRulesBlock,
  buildWamProductKnowledgeBlock,
  buildAnalysisReflectionBlock,
} from "../core/knowledge/wamKnowledgeBase.js";

/** 標準 systemPrompt の骨格 */
export function buildSystemPrompt(config) {
  const {
    role,
    mission,
    constraints = [],
    companyRules = [],
    antiPatterns = [],
    evaluationCriteria = DEFAULT_EVALUATION_CRITERIA,
  } = config;

  const lines = [
    `# 役割\n${role}`,
    `# ミッション\n${mission}`,
    `# 思考プロセス\n${DEFAULT_THINKING_PROCESS}`,
    `# 評価基準\n${evaluationCriteria}`,
    buildBrandRulesBlock(),
    `# 制約`,
    ...constraints.map((c) => `- ${c}`),
    ...companyRules.map((c) => `- ${c}`),
    ...antiPatterns.slice(0, 4).map((c) => `- ${c}`),
    `- 自然な日本語。AIっぽい表現禁止`,
  ];

  return lines.join("\n\n");
}

/** 公式HP ProductKnowledge → プロンプトブロック（WAM KB 委譲） */
export function buildProductKnowledgeBlock(productKnowledge, answers) {
  return buildWamProductKnowledgeBlock(productKnowledge, answers);
}

/** thinkingCore 分析結果ブロック（再エクスポート） */
export { buildAnalysisReflectionBlock };

/** 画像系 — 背景のみ生成する英語プロンプト */
export function buildBackgroundImagePrompt(config) {
  const {
    style = "luxury beauty salon, professional, clean",
    aspect = "1:1",
    mood = "trustworthy, high-end",
    emptyZone = "empty space on the right side for product overlay",
  } = config;

  return [
    `Professional beauty B2B promotional background, ${style}, ${mood},`,
    `aspect ratio ${aspect}, ${emptyZone},`,
    "soft lighting, elegant interior, NO products, NO devices, NO machines,",
    "NO cosmetic bottles, NO packaging, NO logos, NO text",
  ].join(" ");
}

/** 画像系 — negativePrompt 標準 */
export function buildStandardNegativePrompt() {
  return [
    "product, device, machine, cosmetic bottle, packaging, logo,",
    "beauty equipment, salon machine, fake product, generated product,",
    "text artifacts, watermark, low quality, blurry",
  ].join(" ");
}

/** imageDirective オブジェクト */
export function buildImageDirective(productKnowledge, structure, answers) {
  const layout = structure?.layoutSpec;
  return {
    mode: productKnowledge?.imageMode ?? "background_only",
    officialImageUrl: productKnowledge?.officialImageUrl ?? null,
    productName: productKnowledge?.name ?? answers.wam_product ?? null,
    productDescription: productKnowledge?.description ?? null,
    officialUrl: productKnowledge?.officialUrl ?? null,
    layoutSpec: layout ?? null,
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

/** デフォルト営業制約 */
export const DEFAULT_CONSTRAINTS = [...BASE_RULES];
